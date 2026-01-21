
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
  supabaseUrl: 'YOUR_SUPABASE_URL', 
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};

export class Store {
  private static client: SupabaseClient | null = null;

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const settings = this.getSettings();
    const isPlaceholder = settings.supabaseUrl === 'YOUR_SUPABASE_URL';
    if (!isPlaceholder && settings.supabaseUrl && settings.supabaseAnonKey) {
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
    const isPlaceholder = settings.supabaseUrl === 'YOUR_SUPABASE_URL';
    return !!(settings.supabaseUrl && settings.supabaseAnonKey && settings.supabaseUrl.startsWith('http') && !isPlaceholder);
  }

  static getSettings(): Settings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const localSettings = data ? JSON.parse(data) : { ...INITIAL_SETTINGS };
    // Ensure we don't return placeholder values to the logic
    if (localSettings.supabaseUrl === 'YOUR_SUPABASE_URL') localSettings.supabaseUrl = '';
    if (localSettings.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') localSettings.supabaseAnonKey = '';
    return localSettings;
  }

  static async saveSettings(settings: Settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.client = null; 
    await this.syncSettingsToCloud();
  }

  private static async syncSettingsToCloud() {
    const client = this.getClient();
    if (!client) return;
    const settings = this.getSettings();
    try {
      const { supabaseUrl, supabaseAnonKey, ...syncableData } = settings;
      await client.from('app_settings').upsert({ id: 'global', data: syncableData });
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
        const merged = { ...current, ...data.data, supabaseUrl: current.supabaseUrl, supabaseAnonKey: current.supabaseAnonKey };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        window.dispatchEvent(new Event('hb_settings_updated'));
        return merged;
      }
    } catch (e) { console.error("Settings Cloud Sync Failed:", e); }
    return null;
  }

  static async syncLocalToCloud() {
    const client = this.getClient();
    if (!client) return;
    try {
      const children = this.getChildrenLocal();
      if (children.length > 0) await client.from('children').upsert(children);
      const parents = this.getParentsLocal();
      if (parents.length > 0) await client.from('parents').upsert(parents);
      const logs = this.getDailyLogsLocal();
      if (logs.length > 0) await client.from('daily_logs').upsert(logs);
      const holidays = this.getHolidaysLocal();
      if (holidays.length > 0) await client.from('holidays').upsert(holidays);
      await this.syncSettingsToCloud();
    } catch (e) { console.error("Full Sync Error:", e); }
  }

  // --- Logs Logic ---
  private static getDailyLogsLocal(): DailyLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return data ? JSON.parse(data) : [];
  }

  static async getDailyLogs(): Promise<DailyLog[]> {
    const local = this.getDailyLogsLocal();
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('daily_logs').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data));
        return data as DailyLog[];
      }
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
    if (client) await client.from('daily_logs').upsert(log);
  }

  static async getOrCreateDailyLog(childId: string, date: string): Promise<DailyLog> {
    const logId = `${childId}_${date}`;
    const logs = this.getDailyLogsLocal();
    const existing = logs.find(l => l.id === logId);
    if (existing) return existing;
    
    const newLog: DailyLog = {
      id: logId,
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
    
    logs.push(newLog);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    
    const client = this.getClient();
    if (client) await client.from('daily_logs').upsert(newLog);
    
    return newLog;
  }

  static handleRealtimeLogUpdate(remoteLog: DailyLog) {
    const logs = this.getDailyLogsLocal();
    const index = logs.findIndex(l => l.id === remoteLog.id);
    if (index !== -1) logs[index] = remoteLog;
    else logs.push(remoteLog);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('hb_log_synced', { detail: remoteLog }));
  }

  // --- Standard Data Accessors ---
  private static getChildrenLocal(): Child[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    return data ? JSON.parse(data) : [];
  }
  static async getChildren(): Promise<Child[]> {
    const local = this.getChildrenLocal();
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('children').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(data));
        return data as Child[];
      }
    }
    return local;
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

  private static getParentsLocal(): Parent[] {
    const data = localStorage.getItem(STORAGE_KEYS.PARENTS);
    return data ? JSON.parse(data) : [];
  }
  static async getParents(): Promise<Parent[]> {
    const local = this.getParentsLocal();
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('parents').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(data));
        return data as Parent[];
      }
    }
    return local;
  }
  static async saveParents(parents: Parent[]) {
    localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(parents));
    const client = this.getClient();
    if (client) await client.from('parents').upsert(parents);
  }

  private static getHolidaysLocal(): Holiday[] {
    const local = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    return local ? JSON.parse(local) : [];
  }
  static async getHolidays(): Promise<Holiday[]> {
    const local = this.getHolidaysLocal();
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('holidays').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data));
        return data as Holiday[];
      }
    }
    return local;
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

  static async deleteDailyLog(id: string) {
    const logs = this.getDailyLogsLocal().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    const client = this.getClient();
    if (client) await client.from('daily_logs').delete().eq('id', id);
  }

  static isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) === 'true';
  }
  static login() { localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'true'); }
  static logout() { localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN); }

  static async getSendLogs(): Promise<EmailSendLog[]> {
    const client = this.getClient();
    if (client) {
      const { data } = await client.from('send_logs').select('*');
      if (data) return data as EmailSendLog[];
    }
    const data = localStorage.getItem(STORAGE_KEYS.SEND_LOGS);
    return data ? JSON.parse(data) : [];
  }
}
