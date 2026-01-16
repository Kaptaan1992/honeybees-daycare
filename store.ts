
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Child, Parent, DailyLog, Settings, EmailSendLog } from './types';

const STORAGE_KEYS = {
  CHILDREN: 'hb_children',
  PARENTS: 'hb_parents',
  DAILY_LOGS: 'hb_daily_logs',
  SETTINGS: 'hb_settings',
  SEND_LOGS: 'hb_send_logs',
  AUTH_TOKEN: 'hb_auth_token'
};

const INITIAL_CHILDREN: Child[] = [
  {
    id: 'c1',
    firstName: 'Zoya',
    lastName: 'Ahmed',
    dob: '2022-05-15',
    classroom: 'Toddlers',
    active: true,
    parentIds: ['p1'],
    allergies: 'None',
  }
];

const INITIAL_PARENTS: Parent[] = [
  {
    id: 'p1',
    fullName: 'Sara Ahmed',
    email: 'sara@example.com',
    relationship: 'Mom',
    preferredLanguage: 'English',
    receivesEmail: true,
  }
];

const INITIAL_SETTINGS: Settings = {
  daycareName: 'Honeybees Daycare',
  fromEmail: 'reports@honeybeesdaycare.com',
  emailSignature: 'With love,\nHoneybees Daycare Team',
  testEmail: '',
  adminPassword: 'honeybees2025', // Default password
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
};

export class Store {
  private static client: SupabaseClient | null = null;

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      this.client = createClient(settings.supabaseUrl, settings.supabaseAnonKey);
      return this.client;
    }
    return null;
  }

  static isCloudEnabled(): boolean {
    return !!this.getClient();
  }

  static async syncLocalToCloud() {
    const client = this.getClient();
    if (!client) return;
    const { count } = await client.from('children').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await client.from('children').insert(this.getChildrenLocal());
      await client.from('parents').insert(this.getParentsLocal());
      await client.from('daily_logs').insert(this.getDailyLogsLocal());
    }
  }

  // --- Auth ---
  static isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) === 'true';
  }

  static login() {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'true');
  }

  static logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // --- Settings ---
  static getSettings(): Settings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = data ? JSON.parse(data) : INITIAL_SETTINGS;
    if (!settings.adminPassword) {
      settings.adminPassword = INITIAL_SETTINGS.adminPassword;
    }
    return settings;
  }

  static saveSettings(settings: Settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.client = null;
  }

  // --- Children ---
  private static getChildrenLocal(): Child[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    return data ? JSON.parse(data) : INITIAL_CHILDREN;
  }

  static async getChildren(): Promise<Child[]> {
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('children').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(data));
        return data as Child[];
      }
    }
    return this.getChildrenLocal();
  }

  static async saveChildren(children: Child[]) {
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    const client = this.getClient();
    if (client) {
      await client.from('children').upsert(children);
    }
  }

  static async deleteChild(id: string) {
    const children = await this.getChildren();
    const filtered = children.filter(c => c.id !== id);
    await this.saveChildren(filtered);
    
    const client = this.getClient();
    if (client) {
      await client.from('children').delete().eq('id', id);
    }
  }

  // --- Parents ---
  private static getParentsLocal(): Parent[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARENTS);
    return data ? JSON.parse(data) : INITIAL_PARENTS;
  }

  static async getParents(): Promise<Parent[]> {
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('parents').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(data));
        return data as Parent[];
      }
    }
    return this.getParentsLocal();
  }

  static async saveParents(parents: Parent[]) {
    localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(parents));
    const client = this.getClient();
    if (client) {
      await client.from('parents').upsert(parents);
    }
  }

  // --- Daily Logs ---
  private static getDailyLogsLocal(): DailyLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return data ? JSON.parse(data) : [];
  }

  static async getDailyLogs(): Promise<DailyLog[]> {
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('daily_logs').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data));
        return data as DailyLog[];
      }
    }
    return this.getDailyLogsLocal();
  }

  static async saveDailyLogs(logs: DailyLog[]) {
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) {
      await client.from('daily_logs').upsert(logs);
    }
  }

  static async deleteDailyLog(id: string) {
    const logs = await this.getDailyLogs();
    const filtered = logs.filter(l => l.id !== id);
    await this.saveDailyLogs(filtered);
    
    const client = this.getClient();
    if (client) {
      await client.from('daily_logs').delete().eq('id', id);
    }
  }

  static async getOrCreateDailyLog(childId: string, date: string): Promise<DailyLog> {
    const logs = await this.getDailyLogs();
    const existing = logs.find(l => l.childId === childId && l.date === date);
    if (existing) return {
      ...existing,
      medications: existing.medications || []
    };

    const newLog: DailyLog = {
      id: Math.random().toString(36).substr(2, 9),
      childId,
      date,
      arrivalTime: '08:00',
      departureTime: '17:30',
      overallMood: 'Great',
      teacherNotes: '',
      suppliesNeeded: '',
      meals: [],
      bottles: [],
      naps: [],
      diapers: [],
      activities: [],
      medications: [],
      incidents: [],
      status: 'In Progress'
    };
    logs.push(newLog);
    await this.saveDailyLogs(logs);
    return newLog;
  }

  // --- Send Logs ---
  private static getSendLogsLocal(): EmailSendLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.SEND_LOGS);
    return data ? JSON.parse(data) : [];
  }

  static async getSendLogs(): Promise<EmailSendLog[]> {
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('send_logs').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.SEND_LOGS, JSON.stringify(data));
        return data as EmailSendLog[];
      }
    }
    return this.getSendLogsLocal();
  }

  static async saveSendLogs(logs: EmailSendLog[]) {
    localStorage.setItem(STORAGE_KEYS.SEND_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) {
      await client.from('send_logs').upsert(logs);
    }
  }
}
