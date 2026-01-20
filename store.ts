
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Child, Parent, DailyLog, Settings, EmailSendLog, Holiday } from './types';

const STORAGE_KEYS = {
  CHILDREN: 'hb_children',
  PARENTS: 'hb_parents',
  DAILY_LOGS: 'hb_daily_logs',
  SETTINGS: 'hb_settings',
  SEND_LOGS: 'hb_send_logs',
  AUTH_TOKEN: 'hb_auth_token',
  HOLIDAYS: 'hb_holidays'
};

const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: "Martin Luther King Jr. Day", date: '2026-01-19', type: 'Closed' },
  { id: 'h2', name: "Presidents' Day", date: '2026-02-16', type: 'Closed' },
  { id: 'h3', name: "Eid al-Fitr (Tentative)", date: '2026-03-20', type: 'Closed' },
  { id: 'h4', name: "Memorial Day", date: '2026-05-25', type: 'Closed' },
  { id: 'h5', name: "Eid al-Adha (Tentative)", date: '2026-05-27', type: 'Closed' },
  { id: 'h6', name: "Juneteenth", date: '2026-06-19', type: 'Closed' },
  { id: 'h7', name: "Independence Day (Observed)", date: '2026-07-03', type: 'Closed' },
  { id: 'h8', name: "Labor Day", date: '2026-09-07', type: 'Closed' },
  { id: 'h9', name: "Columbus Day / Indigenous Peoples' Day", date: '2026-10-12', type: 'Closed' },
  { id: 'h10', name: "Veterans Day", date: '2026-11-11', type: 'Closed' },
  { id: 'h11', name: "Thanksgiving Break", date: '2026-11-26', type: 'Break' },
  { id: 'h12', name: "Thanksgiving Break", date: '2026-11-27', type: 'Break' },
  { id: 'h13', name: "Christmas Break", date: '2026-12-24', type: 'Break' },
  { id: 'h14', name: "Christmas Break", date: '2026-12-25', type: 'Break' },
  { id: 'h15', name: "New Year's Eve", date: '2026-12-31', type: 'Half Day' },
  { id: 'h16', name: "New Year's Day", date: '2027-01-01', type: 'Closed' },
];

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
  adminPassword: 'honeybees2025',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  sendCopyToSelfDefault: false,
  // ENCODED SUPABASE CREDENTIALS - Placeholders for user to fill in source
  supabaseUrl: '', 
  supabaseAnonKey: ''
};

export class Store {
  private static client: SupabaseClient | null = null;

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const settings = this.getSettings();
    // Validate URL format before attempting connection
    if (settings.supabaseUrl && settings.supabaseAnonKey && 
        settings.supabaseUrl.startsWith('http') && 
        settings.supabaseUrl.includes('.supabase.co')) {
      try {
        this.client = createClient(settings.supabaseUrl, settings.supabaseAnonKey);
        return this.client;
      } catch (e) {
        console.error("Supabase Connection Failed:", e);
        return null;
      }
    }
    return null;
  }

  static isCloudEnabled(): boolean {
    const settings = this.getSettings();
    return !!(settings.supabaseUrl && settings.supabaseAnonKey && settings.supabaseUrl.startsWith('http'));
  }

  static async syncLocalToCloud() {
    const client = this.getClient();
    if (!client) return;

    try {
      // Short timeout check for connection
      const { count, error } = await client.from('children').select('*', { count: 'exact', head: true }).limit(1);
      if (error) throw error;
      
      if (count === 0) {
        await client.from('children').insert(this.getChildrenLocal());
        await client.from('parents').insert(this.getParentsLocal());
        await client.from('daily_logs').insert(this.getDailyLogsLocal());
        await client.from('holidays').insert(this.getHolidaysLocal());
      }
      await this.syncSettingsToCloud();
    } catch (e) {
      console.error("Supabase Sync Error:", e);
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
    const settings = data ? JSON.parse(data) : { ...INITIAL_SETTINGS };
    if (!settings.adminPassword) settings.adminPassword = INITIAL_SETTINGS.adminPassword;
    
    // Ensure the hardcoded placeholders are used if local storage is empty
    if (!settings.supabaseUrl && INITIAL_SETTINGS.supabaseUrl) settings.supabaseUrl = INITIAL_SETTINGS.supabaseUrl;
    if (!settings.supabaseAnonKey && INITIAL_SETTINGS.supabaseAnonKey) settings.supabaseAnonKey = INITIAL_SETTINGS.supabaseAnonKey;
    
    return settings;
  }

  static async saveSettings(settings: Settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.client = null; // Reset client to force re-init with new keys
    await this.syncSettingsToCloud();
  }

  private static async syncSettingsToCloud() {
    const client = this.getClient();
    if (!client) return;
    const settings = this.getSettings();
    try {
      await client.from('app_settings').upsert({ id: 'global', data: settings });
    } catch (e) {
      console.error("Failed to sync settings to cloud", e);
    }
  }

  static async syncSettingsFromCloud(): Promise<Settings | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.from('app_settings').select('data').eq('id', 'global').maybeSingle();
      if (!error && data && data.data) {
        const current = this.getSettings();
        const merged = { 
          ...data.data, 
          supabaseUrl: current.supabaseUrl, 
          supabaseAnonKey: current.supabaseAnonKey 
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        return merged;
      }
    } catch (e) { console.error(e); }
    return null;
  }

  // --- Holidays ---
  private static getHolidaysLocal(): Holiday[] {
    const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    return data ? JSON.parse(data) : INITIAL_HOLIDAYS;
  }

  static async getHolidays(): Promise<Holiday[]> {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from('holidays').select('*');
        if (!error && data) {
          localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data));
          return data as Holiday[];
        }
      } catch (e) { console.warn("Holidays sync failed", e); }
    }
    return this.getHolidaysLocal();
  }

  static async saveHolidays(holidays: Holiday[]) {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
    const client = this.getClient();
    if (client) await client.from('holidays').upsert(holidays);
  }

  static async deleteHoliday(id: string) {
    const holidays = (await this.getHolidays()).filter(h => h.id !== id);
    await this.saveHolidays(holidays);
    const client = this.getClient();
    if (client) await client.from('holidays').delete().eq('id', id);
  }

  // --- Children ---
  private static getChildrenLocal(): Child[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    return data ? JSON.parse(data) : INITIAL_CHILDREN;
  }

  static async getChildren(): Promise<Child[]> {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from('children').select('*');
        if (!error && data) {
          localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(data));
          return data as Child[];
        }
      } catch (e) { console.warn("Children sync failed", e); }
    }
    return this.getChildrenLocal();
  }

  static async saveChildren(children: Child[]) {
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    const client = this.getClient();
    if (client) await client.from('children').upsert(children);
  }

  static async deleteChild(id: string) {
    const children = (await this.getChildren()).filter(c => c.id !== id);
    await this.saveChildren(children);
    const client = this.getClient();
    if (client) await client.from('children').delete().eq('id', id);
  }

  // --- Parents ---
  private static getParentsLocal(): Parent[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARENTS);
    return data ? JSON.parse(data) : INITIAL_PARENTS;
  }

  static async getParents(): Promise<Parent[]> {
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.from('parents').select('*');
        if (!error && data) {
          localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(data));
          return data as Parent[];
        }
      } catch (e) { console.warn("Parents sync failed", e); }
    }
    return this.getParentsLocal();
  }

  static async saveParents(parents: Parent[]) {
    localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(parents));
    const client = this.getClient();
    if (client) await client.from('parents').upsert(parents);
  }

  // --- Daily Logs ---
  private static getDailyLogsLocal(): DailyLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return data ? JSON.parse(data) : [];
  }

  static async getDailyLogs(): Promise<DailyLog[]> {
    const client = this.getClient();
    const local = this.getDailyLogsLocal();
    
    if (client) {
      try {
        const { data, error } = await client.from('daily_logs').select('*');
        if (!error && data) {
          const mergedMap = new Map();
          local.forEach(item => mergedMap.set(item.id, item));
          data.forEach(item => mergedMap.set(item.id, item));
          
          const merged = Array.from(mergedMap.values());
          localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(merged));
          return merged;
        }
      } catch (e) { console.warn("Logs sync failed", e); }
    }
    return local;
  }

  static async saveDailyLog(log: DailyLog) {
    const logs = this.getDailyLogsLocal();
    const index = logs.findIndex(l => l.id === log.id);
    if (index !== -1) logs[index] = log;
    else logs.push(log);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    
    const client = this.getClient();
    if (client) {
      try {
        await client.from('daily_logs').upsert(log);
      } catch (e) { console.error("Cloud log save failed", e); }
    }
  }

  static async saveDailyLogs(logs: DailyLog[]) {
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) await client.from('daily_logs').upsert(logs);
  }

  static async deleteDailyLog(id: string) {
    const logs = this.getDailyLogsLocal().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) await client.from('daily_logs').delete().eq('id', id);
  }

  static async getOrCreateDailyLog(childId: string, date: string): Promise<DailyLog> {
    const logs = await this.getDailyLogs();
    const existing = logs.find(l => l.childId === childId && l.date === date);
    if (existing) return {
      ...existing,
      medications: existing.medications || [],
      activityNotes: existing.activityNotes || '',
      isPresent: existing.isPresent ?? false,
      includeTrends: existing.includeTrends ?? false
    };

    const newLog: DailyLog = {
      id: Math.random().toString(36).substr(2, 9),
      childId,
      date,
      arrivalTime: '08:00',
      departureTime: '17:30',
      overallMood: 'Great',
      teacherNotes: '',
      activityNotes: '',
      suppliesNeeded: '',
      meals: [],
      bottles: [],
      naps: [],
      diapers: [],
      activities: [],
      medications: [],
      incidents: [],
      status: 'In Progress',
      isPresent: false,
      includeTrends: false
    };
    await this.saveDailyLog(newLog);
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
      try {
        const { data } = await client.from('send_logs').select('*');
        if (data) {
          localStorage.setItem(STORAGE_KEYS.SEND_LOGS, JSON.stringify(data));
          return data as EmailSendLog[];
        }
      } catch (e) { console.warn("Send logs sync failed", e); }
    }
    return this.getSendLogsLocal();
  }

  static async saveSendLogs(logs: EmailSendLog[]) {
    localStorage.setItem(STORAGE_KEYS.SEND_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) await client.from('send_logs').upsert(logs);
  }
}
