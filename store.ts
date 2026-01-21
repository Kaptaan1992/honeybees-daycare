
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
  supabaseUrl: '', 
  supabaseAnonKey: ''
};

const SEED_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: 'Martin Luther King Jr. Day', date: '2026-01-19', type: 'Closed' },
  { id: 'h2', name: "Presidents' Day", date: '2026-02-16', type: 'Closed' },
  { id: 'h3', name: 'Eid al-Fitr (Tentative)', date: '2026-03-20', type: 'Closed', notes: 'Tentative - moon sighting' },
  { id: 'h4', name: 'Memorial Day', date: '2026-05-25', type: 'Closed' },
  { id: 'h5', name: 'Eid al-Adha (Tentative)', date: '2026-05-27', type: 'Closed', notes: 'Tentative - moon sighting' },
  { id: 'h6', name: 'Juneteenth', date: '2026-06-19', type: 'Closed' },
  { id: 'h7', name: 'Independence Day (Observed)', date: '2026-07-03', type: 'Closed' },
  { id: 'h8', name: 'Labor Day', date: '2026-09-07', type: 'Closed' },
  { id: 'h9', name: "Columbus Day / Indigenous Peoples' Day", date: '2026-10-12', type: 'Closed' },
  { id: 'h10', name: 'Veterans Day', date: '2026-11-11', type: 'Closed' },
  { id: 'h11', name: 'Thanksgiving Break', date: '2026-11-26', type: 'Closed' },
  { id: 'h12', name: 'Thanksgiving Break', date: '2026-11-27', type: 'Closed' },
  { id: 'h13', name: 'Christmas Break', date: '2026-12-24', type: 'Closed' },
  { id: 'h14', name: 'Christmas Break', date: '2026-12-25', type: 'Closed' },
  { id: 'h15', name: "New Year's Eve", date: '2026-12-31', type: 'Half Day' },
  { id: 'h16', name: "New Year's Day", date: '2027-01-01', type: 'Closed' },
];

export class Store {
  private static client: SupabaseClient | null = null;

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
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

  static getSettings(): Settings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const localSettings = data ? JSON.parse(data) : { ...INITIAL_SETTINGS };
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
      const holidays = await this.getHolidays();
      if (holidays.length > 0) await client.from('holidays').upsert(holidays);
      await this.syncSettingsToCloud();
    } catch (e) { console.error("Full Sync Error:", e); }
  }

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

  private static getChildrenLocal(): Child[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHILDREN);
    return data ? JSON.parse(data) : [];
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
    if (client) await client.from('parents').upsert(parents);
  }

  private static getHolidaysLocal(): Holiday[] {
    const local = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    const holidays = local ? JSON.parse(local) : [];
    if (holidays.length === 0) {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(SEED_HOLIDAYS));
      return SEED_HOLIDAYS;
    }
    return holidays;
  }

  static async getHolidays(): Promise<Holiday[]> {
    const client = this.getClient();
    if (client) {
      const { data, error } = await client.from('holidays').select('*');
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(data));
        return data as Holiday[];
      }
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
