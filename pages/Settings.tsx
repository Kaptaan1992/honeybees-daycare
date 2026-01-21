
import React, { useState, useEffect } from 'react';
import { Store } from '../store';
import { Settings } from '../types';
import { 
  Save, 
  CheckCircle, 
  Mail, 
  ShieldCheck, 
  Key, 
  Info, 
  ExternalLink,
  Database,
  Cloud,
  Lock,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Copy
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(Store.getSettings());
  const [saved, setSaved] = useState(false);
  
  // Password Change State
  const [passwordState, setPasswordState] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Listen for background sync updates from App.tsx
  useEffect(() => {
    const handleBackgroundSync = () => {
      setSettings(Store.getSettings());
    };
    window.addEventListener('hb_settings_updated', handleBackgroundSync);
    return () => window.removeEventListener('hb_settings_updated', handleBackgroundSync);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Store.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    const currentStored = settings.adminPassword || 'honeybees2025';

    if (passwordState.current !== currentStored) {
      setPasswordError('Current password is incorrect.');
      return;
    }

    if (passwordState.new.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (passwordState.new !== passwordState.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const updatedSettings = { ...settings, adminPassword: passwordState.new };
    Store.saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setPasswordSuccess(true);
    setPasswordState({ current: '', new: '', confirm: '' });
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">App Settings</h1>
        <p className="text-slate-500">Configure your cloud sync and email automation.</p>
      </div>

      <div className="space-y-8">
        {/* Security Section */}
        <section className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-red-50 pb-4">
            <Lock size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">Admin Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={14} />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle size={14} />
                <span>Password updated!</span>
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Current Password</label>
                <input 
                  type="password" 
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none transition-all text-sm"
                  value={passwordState.current}
                  onChange={e => setPasswordState({...passwordState, current: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">New Password</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none transition-all text-sm"
                    value={passwordState.new}
                    onChange={e => setPasswordState({...passwordState, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Confirm New</label>
                  <input 
                    type="password" 
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none transition-all text-sm"
                    value={passwordState.confirm}
                    onChange={e => setPasswordState({...passwordState, confirm: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-6 py-3 rounded-2xl transition-all text-sm"
            >
              Update Admin Password
            </button>
          </form>
        </section>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Cloud Sync Section */}
          <section className="bg-white rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-blue-50 pb-4">
              <div className="flex items-center gap-2">
                <Database size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800">Cloud Sync (Supabase)</h2>
              </div>
              <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                Open Dashboard <ExternalLink size={12}/>
              </a>
            </div>

            <div className="bg-blue-50/50 text-blue-800 p-6 rounded-3xl space-y-3 text-xs leading-relaxed border border-blue-100">
              <div className="flex items-center gap-2 font-bold mb-1 text-blue-900">
                <Smartphone size={14}/>
                <span>Device Setup:</span>
              </div>
              <p>Enter these keys on <strong>each device</strong> (iPhone, iPad, PC) once to sync all your data instantly.</p>
              
              <div className="mt-4 p-3 bg-white/50 rounded-xl space-y-2">
                <p className="font-bold flex items-center gap-1"><Info size={12}/> Finding your keys:</p>
                <p>1. Settings (Gear ⚙️) → API</p>
                <p>2. Copy <strong>Project URL</strong> and <strong>anon public</strong> key.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Supabase URL</label>
                <input 
                  type="text" 
                  placeholder="https://abcdefghijklm.supabase.co"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm font-mono"
                  value={settings.supabaseUrl || ''}
                  onChange={e => setSettings({...settings, supabaseUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Anon Key</label>
                <input 
                  type="text" 
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm font-mono"
                  value={settings.supabaseAnonKey || ''}
                  onChange={e => setSettings({...settings, supabaseAnonKey: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Email Automation Section */}
          <section className="bg-white rounded-3xl border border-amber-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-amber-50 pb-4">
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-amber-500" />
                <h2 className="text-lg font-bold text-slate-800">Email Reports (EmailJS)</h2>
              </div>
              <a href="https://dashboard.emailjs.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                EmailJS Login <ExternalLink size={12}/>
              </a>
            </div>
            
            <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl space-y-4 text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Info size={14}/>
                <span>EmailJS Setup Instructions:</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="bg-amber-400/20 text-amber-400 h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                  <p>Add <strong>Gmail Service</strong>. Copy the <strong>Service ID</strong> below.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-amber-400/20 text-amber-400 h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                  <p>Create a <strong>New Template</strong>. Set subject to <code className="text-amber-200">{"{{subject}}"}</code> and body to <code className="text-amber-200">{"{{{html_message}}}"}</code> (using 3 brackets).</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-amber-400/20 text-amber-400 h-5 w-5 rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                  <p>In your <strong>Account</strong> page, copy your <strong>Public Key</strong>.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Test Email (Optional)</label>
                <input 
                  type="email" 
                  placeholder="Your personal email for testing"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm"
                  value={settings.testEmail || ''}
                  onChange={e => setSettings({...settings, testEmail: e.target.value})}
                />
              </div>

              <div className="h-px bg-slate-50 my-2" />

              <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors">
                <div className="bg-white p-2 rounded-xl shadow-sm text-amber-600">
                  <Copy size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Staff Records (BCC)</p>
                  <p className="text-[10px] text-amber-700/60 font-medium">Automatically send a copy of every daily report to your email.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-amber-600 rounded-lg"
                  checked={settings.sendCopyToSelfDefault || false}
                  onChange={e => setSettings({...settings, sendCopyToSelfDefault: e.target.checked})}
                />
              </label>

              <div className="h-px bg-slate-50 my-2" />

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <ShieldCheck size={12}/> Service ID
                </label>
                <input 
                  type="text" 
                  placeholder="service_xxxxx"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm font-mono"
                  value={settings.emailjsServiceId || ''}
                  onChange={e => setSettings({...settings, emailjsServiceId: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <Database size={12}/> Template ID
                </label>
                <input 
                  type="text" 
                  placeholder="template_xxxxx"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm font-mono"
                  value={settings.emailjsTemplateId || ''}
                  onChange={e => setSettings({...settings, emailjsTemplateId: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                  <Key size={12}/> Public Key
                </label>
                <input 
                  type="text" 
                  placeholder="Your Account Public Key"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm font-mono"
                  value={settings.emailjsPublicKey || ''}
                  onChange={e => setSettings({...settings, emailjsPublicKey: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-amber-100 p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-amber-50 pb-4">Daycare Branding</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Daycare Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={settings.daycareName}
                  onChange={e => setSettings({...settings, daycareName: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Daycare Contact Email (for self-copies)</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm"
                  value={settings.fromEmail}
                  onChange={e => setSettings({...settings, fromEmail: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email Signature</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm h-24"
                  value={settings.emailSignature}
                  onChange={e => setSettings({...settings, emailSignature: e.target.value})}
                />
              </div>
            </div>
          </section>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-5 rounded-3xl shadow-xl transition-all transform active:scale-95"
          >
            {saved ? <CheckCircle /> : <Save />}
            <span>{saved ? 'Settings Saved!' : 'Save All Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
