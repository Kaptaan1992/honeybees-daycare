
import React, { useState, useEffect, useCallback } from 'react';
import { Store } from '../store';
import { Holiday } from '../types';
import { Plus, Trash2, Edit2, Calendar, Loader2, X, Check, AlertCircle } from 'lucide-react';

const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Holiday>>({
    name: '',
    date: '',
    type: 'Closed'
  });

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    const data = await Store.getHolidays();
    setHolidays(data.sort((a, b) => a.date.localeCompare(b.date)));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(true);
    
    // Listen for real-time cloud updates
    const handleSync = () => loadData(false);
    window.addEventListener('hb_data_updated', handleSync);
    return () => window.removeEventListener('hb_data_updated', handleSync);
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return;

    let updated;
    if (editingId) {
      updated = holidays.map(h => h.id === editingId ? { ...h, ...formData } : h);
    } else {
      updated = [...holidays, { ...formData, id: Math.random().toString(36).substr(2, 9) } as Holiday];
    }

    setHolidays(updated.sort((a, b) => a.date.localeCompare(b.date)));
    await Store.saveHolidays(updated);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', date: '', type: 'Closed' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this closure date? Parents will no longer see notifications for it.')) {
      await Store.deleteHoliday(id);
      loadData(false);
    }
  };

  const startEdit = (h: Holiday) => {
    setEditingId(h.id);
    setFormData(h);
    setIsAdding(true);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Calendar...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-brand font-extrabold text-amber-900">Daycare Closures</h1>
          <p className="text-slate-500 font-medium">Manage holidays and breaks shown in parent reports.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <Plus size={20} />
          <span>Add Date</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holidays.map(h => (
          <div key={h.id} className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${h.type === 'Closed' ? 'bg-red-50 text-red-500' : h.type === 'Half Day' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{h.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h.type}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(h)} className="p-1.5 text-slate-300 hover:text-amber-500"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(h.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
               <span className="text-sm font-black text-slate-700">
                {new Date(h.date.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
               </span>
            </div>
          </div>
        ))}
        {holidays.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border-2 border-dashed border-amber-100 rounded-3xl text-slate-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">No upcoming closures scheduled.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit' : 'Add'} Closure Date</h2>
              <button type="button" onClick={resetForm} className="text-slate-400"><X /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Holiday/Event Name</label>
                <input 
                  type="text" required placeholder="e.g. Labor Day"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Closure Type</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="Closed">Closed</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Break">Break</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 items-start border border-amber-100">
               <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
               <p className="text-xs text-amber-800 leading-relaxed">
                 Holidays added here will automatically appear at the top of Daily Reports starting 30 days before the date.
               </p>
            </div>

            <button type="submit" className="w-full bg-amber-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-100 transition-transform active:scale-95 flex items-center justify-center gap-2">
              <Check size={20} />
              <span>Save Closure Date</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default HolidayManagement;
