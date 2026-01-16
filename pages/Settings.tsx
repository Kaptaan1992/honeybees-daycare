
import React, { useState } from 'react';
import { Store } from '../store';
import { Settings } from '../types';
import { 
  Save, 
  CheckCircle, 
  Beaker, 
  Mail, 
  ShieldCheck, 
  Key, 
  Info, 
  ExternalLink,
  Database,
  Cloud,
  ArrowRight
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(Store.getSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Store.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">App Settings</h1>
        <p className="text-slate-500">Sync data between devices and customize your reports.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Section */}
        <section className="bg-white rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-blue-50 pb-4">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Cloud Sync (Supabase)</h2>
            </div>
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
              Supabase Panel <ExternalLink size={12}/>
            </a>
          </div>

          <div className="bg-blue-50/50 text-blue-800 p-5 rounded-2xl space-y-3 text-xs leading-relaxed border border-blue-100">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Cloud size={14}/>
              <span>Enable real-time syncing across all devices:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Create a project at <strong>Supabase.com</strong></li>
              <li>Run the SQL in the <strong>README.md</strong> in the SQL Editor</li>
              <li>Paste your <strong>Project URL</strong> and <strong>Anon Key</strong> below</li>
            </ol>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Supabase URL</label>
              <input 
                type="text" 
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm font-mono"
                value={settings.supabaseUrl || ''}
                onChange={e => setSettings({...settings, supabaseUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Anon Key</label>
              <input 
                type="text" 
                placeholder="Your project anon key"
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm font-mono"
                value={settings.supabaseAnonKey || ''}
                onChange={e => setSettings({...settings, supabaseAnonKey: e.target.value})}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-amber-100 p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b border-amber-50 pb-4">Daycare Information</h2>
          
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
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Reply-To Email Address</label>
              <p className="text-[10px] text-slate-400 mb-2 italic">Parents will reply to this address.</p>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                value={settings.fromEmail}
                onChange={e => setSettings({...settings, fromEmail: e.target.value})}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-amber-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-amber-50 pb-4">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800">One-Click Send (Gmail)</h2>
            </div>
            <a href="https://dashboard.emailjs.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
              EmailJS Dashboard <ExternalLink size={12}/>
            </a>
          </div>
          
          <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Info size={14}/>
              <span>How to enable direct sending:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Create a free account at <strong>EmailJS.com</strong>.</li>
              <li>Connect your <strong>Gmail Service</strong>.</li>
              <li>Template body: <code className="text-amber-200">{"{{{html_message}}}"}</code></li>
            </ol>
          </div>

          <div className="grid gap-4">
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

        <button 
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-5 rounded-3xl shadow-xl transition-all transform active:scale-95"
        >
          {saved ? <CheckCircle /> : <Save />}
          <span>{saved ? 'Settings Saved!' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
