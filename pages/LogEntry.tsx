
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store } from '../store';
import { 
  DailyLog, 
  Child, 
  MealEntry, 
  BottleEntry, 
  NapEntry, 
  DiaperPottyEntry, 
  ActivityEntry,
  MedicationEntry,
  Mood,
  MealAmount,
  NapQuality,
  DiaperType
} from '../types';
import { 
  ArrowLeft, 
  Utensils, 
  Baby, 
  Moon, 
  Wind, 
  Palette,
  Send,
  Trash2,
  Clock,
  Sparkles,
  Loader2,
  Pill,
  ChevronDown,
  X,
  Music,
  Trees,
  BookOpen,
  Users,
  Smile,
  Zap,
  Star
} from 'lucide-react';

const format12h = (timeStr: string) => {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LogEntry: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayDateStr());

  const loadData = useCallback(async (dateToLoad: string) => {
    if (!childId) return;
    setIsLoading(true);
    const allChildren = await Store.getChildren();
    const foundChild = allChildren.find(c => c.id === childId);
    if (foundChild) {
      setChild(foundChild);
      const dailyLog = await Store.getOrCreateDailyLog(childId, dateToLoad);
      setLog(dailyLog);
    }
    setIsLoading(false);
  }, [childId]);

  useEffect(() => {
    loadData(currentDate);
    const interval = setInterval(() => {
      const nowStr = getTodayDateStr();
      if (nowStr !== currentDate) setCurrentDate(nowStr);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDate, loadData]);

  const updateLog = async (updates: Partial<DailyLog>) => {
    if (!log) return;
    const newLog = { ...log, ...updates };
    setLog(newLog);
    const allLogs = await Store.getDailyLogs();
    const index = allLogs.findIndex(l => l.id === log.id);
    if (index !== -1) allLogs[index] = newLog;
    else allLogs.push(newLog);
    await Store.saveDailyLogs(allLogs);
  };

  const getCurrentTime24 = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const addMeal = () => {
    const meal: MealEntry = { id: Math.random().toString(36).substr(2, 9), time: getCurrentTime24(), type: 'Snack', items: '', amount: 'All' };
    updateLog({ meals: [...log!.meals, meal] });
  };

  const addBottle = () => {
    const bottle: BottleEntry = { id: Math.random().toString(36).substr(2, 9), time: getCurrentTime24(), type: 'Milk', amount: '4oz' };
    updateLog({ bottles: [...log!.bottles, bottle] });
  };

  const addNap = () => {
    const nap: NapEntry = { id: Math.random().toString(36).substr(2, 9), startTime: getCurrentTime24(), endTime: '', quality: 'Great' };
    updateLog({ naps: [...log!.naps, nap] });
  };

  const addDiaper = () => {
    const diaper: DiaperPottyEntry = { id: Math.random().toString(36).substr(2, 9), time: getCurrentTime24(), type: 'Wet' };
    updateLog({ diapers: [...log!.diapers, diaper] });
  };

  const addMedication = () => {
    const med: MedicationEntry = { id: Math.random().toString(36).substr(2, 9), time: getCurrentTime24(), name: '', dosage: '' };
    updateLog({ medications: [...(log!.medications || []), med] });
  };

  const toggleActivity = (category: string) => {
    if (!log) return;
    const existingIndex = log.activities.findIndex(a => a.category === category);
    if (existingIndex > -1) {
      updateLog({ activities: log.activities.filter(a => a.category !== category) });
    } else {
      const newActivity: ActivityEntry = { 
        id: Math.random().toString(36).substr(2, 9), 
        category: category as any, 
        description: '', 
        time: getCurrentTime24() 
      };
      updateLog({ activities: [...log.activities, newActivity] });
    }
  };

  const removeEntry = (type: keyof DailyLog, id: string) => {
    const list = log![type] as any[];
    updateLog({ [type]: list.filter(item => item.id !== id) });
  };

  const updateEntry = (type: keyof DailyLog, id: string, updates: any) => {
    const list = log![type] as any[];
    updateLog({ 
      [type]: list.map(item => item.id === id ? { ...item, ...updates } : item) 
    });
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Loading Child Log...</p>
    </div>
  );

  if (!child || !log) return <div className="p-8 text-center text-amber-900 font-bold">Child not found.</div>;

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-amber-600 transition-colors">
          <ArrowLeft />
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-brand font-extrabold text-amber-900">{child.firstName}'s Day</h1>
          <p className="text-sm text-slate-500 font-medium">
            {new Date(currentDate.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Overall Mood</label>
          <div className="flex gap-2">
            {(['Great', 'Good', 'Okay', 'Not Great'] as Mood[]).map(m => (
              <button
                key={m} onClick={() => updateLog({ overallMood: m })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  log.overallMood === m ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Check In ({format12h(log.arrivalTime)})</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input type="time" className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-400 text-sm" value={log.arrivalTime} onChange={(e) => updateLog({ arrivalTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Check Out ({format12h(log.departureTime)})</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input type="time" className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-400 text-sm" value={log.departureTime} onChange={(e) => updateLog({ departureTime: e.target.value })} />
            </div>
          </div>
        </div>
      </section>

      {/* Routine Quick Add */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <ActionButton icon={Utensils} label="Meal" color="amber" onClick={addMeal} />
        <ActionButton icon={Baby} label="Bottle" color="blue" onClick={addBottle} />
        <ActionButton icon={Moon} label="Nap" color="purple" onClick={addNap} />
        <ActionButton icon={Wind} label="Diaper" color="emerald" onClick={addDiaper} />
        <ActionButton icon={Pill} label="Meds" color="indigo" onClick={addMedication} />
      </div>

      <div className="space-y-4">
        <MedicationList items={log.medications || []} childMeds={child.dailyMedications || []} onUpdate={(id, updates) => updateEntry('medications', id, updates)} onRemove={(id) => removeEntry('medications', id)} />
        <MealList items={log.meals} onUpdate={(id, updates) => updateEntry('meals', id, updates)} onRemove={(id) => removeEntry('meals', id)} />
        <BottleList items={log.bottles} onUpdate={(id, updates) => updateEntry('bottles', id, updates)} onRemove={(id) => removeEntry('bottles', id)} />
        <NapList items={log.naps} onUpdate={(id, updates) => updateEntry('naps', id, updates)} onRemove={(id) => removeEntry('naps', id)} />
        <DiaperList items={log.diapers} onUpdate={(id, updates) => updateEntry('diapers', id, updates)} onRemove={(id) => removeEntry('diapers', id)} />
      </div>

      {/* Activity Multi-Select Section */}
      <section className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm border-l-4 border-l-rose-400 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Palette size={18} className="text-rose-500" />
          Today's Activities
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          <ActivityToggle category="Art" icon={Palette} isActive={log.activities.some(a => a.category === 'Art')} onClick={() => toggleActivity('Art')} />
          <ActivityToggle category="Outdoor" icon={Trees} isActive={log.activities.some(a => a.category === 'Outdoor')} onClick={() => toggleActivity('Outdoor')} />
          <ActivityToggle category="Story" icon={BookOpen} isActive={log.activities.some(a => a.category === 'Story')} onClick={() => toggleActivity('Story')} />
          <ActivityToggle category="Music" icon={Music} isActive={log.activities.some(a => a.category === 'Singing')} onClick={() => toggleActivity('Singing')} />
          <ActivityToggle category="Circle" icon={Users} isActive={log.activities.some(a => a.category === 'Circle Time')} onClick={() => toggleActivity('Circle Time')} />
          <ActivityToggle category="Sensory" icon={Zap} isActive={log.activities.some(a => a.category === 'Sensory')} onClick={() => toggleActivity('Sensory')} />
          <ActivityToggle category="Free Play" icon={Smile} isActive={log.activities.some(a => a.category === 'Free Play')} onClick={() => toggleActivity('Free Play')} />
          <ActivityToggle category="Tummy Time" icon={Baby} isActive={log.activities.some(a => a.category === 'Tummy Time')} onClick={() => toggleActivity('Tummy Time')} />
          <ActivityToggle category="Other" icon={Star} isActive={log.activities.some(a => a.category === 'Other')} onClick={() => toggleActivity('Other')} />
        </div>
        
        {log.activities.length > 0 && (
          <div className="bg-rose-50/30 p-4 rounded-2xl animate-in fade-in">
            <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 block">Activity Highlights & Notes</label>
            <textarea 
              placeholder="Tell parents about today's fun activities..."
              className="w-full bg-white border-none rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-rose-200 outline-none"
              value={log.activityNotes}
              onChange={(e) => updateLog({ activityNotes: e.target.value })}
            />
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Teacher's General Notes</label>
          <textarea className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 min-h-[100px] text-sm outline-none" placeholder="Overall vibe for the day..." value={log.teacherNotes} onChange={(e) => updateLog({ teacherNotes: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Supplies Needed</label>
          <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 text-sm outline-none" placeholder="e.g. More diapers" value={log.suppliesNeeded} onChange={(e) => updateLog({ suppliesNeeded: e.target.value })} />
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-gradient-to-t from-amber-50 to-transparent flex justify-center">
        <button onClick={() => navigate(`/report/${childId}/${currentDate}`)} className="w-full max-w-2xl flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-amber-200 transition-all transform hover:scale-[1.02] active:scale-95">
          <Send size={20} />
          <span>Preview & Send Daily Report</span>
        </button>
      </div>
    </div>
  );
};

const ActivityToggle = ({ category, icon: Icon, isActive, onClick }: { category: string, icon: any, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
      isActive 
        ? 'bg-rose-100 border-rose-300 text-rose-700 shadow-inner' 
        : 'bg-white border-slate-100 text-slate-400 hover:border-rose-100 hover:bg-rose-50/50'
    }`}
  >
    <Icon size={20} className={isActive ? 'animate-bounce' : ''} />
    <span className="text-[9px] font-bold uppercase mt-1 tracking-tight">{category}</span>
  </button>
);

const ActionButton = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border shadow-sm hover:shadow-md transition-all active:scale-95 ${colors[color]}`}>
      <Icon size={18} className="mb-1" />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
};

const MedicationItem: React.FC<{ item: MedicationEntry, childMeds: string[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }> = ({ item, childMeds, onUpdate, onRemove }) => {
  const isStandard = childMeds.includes(item.name) || item.name === "";
  const [isManualInput, setIsManualInput] = useState(!isStandard && item.name !== "");
  return (
    <div className="bg-indigo-50/30 p-4 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-24">
          <div className="text-[8px] font-bold text-indigo-400 uppercase ml-1 mb-0.5">{format12h(item.time)}</div>
          <input type="time" className="w-full bg-white border-none rounded-lg p-1.5 text-xs font-bold text-indigo-600 outline-none" value={item.time} onChange={(e) => onUpdate(item.id, { time: e.target.value })} />
        </div>
        <div className="flex-1 space-y-2">
          {!isManualInput && childMeds.length > 0 ? (
            <div className="relative">
              <select className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold text-slate-700 pr-8 appearance-none outline-none" value={item.name} onChange={(e) => e.target.value === "OTHER_MANUAL" ? (setIsManualInput(true), onUpdate(item.id, { name: "" })) : onUpdate(item.id, { name: e.target.value })}>
                <option value="">Select Medication...</option>
                {childMeds.map(med => <option key={med} value={med}>{med}</option>)}
                <option value="OTHER_MANUAL">+ Add Other...</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="text" autoFocus={isManualInput} placeholder="Medication..." className="flex-1 bg-white border-none rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" value={item.name} onChange={(e) => onUpdate(item.id, { name: e.target.value })} />
              {childMeds.length > 0 && <button onClick={() => setIsManualInput(false)} className="text-indigo-400"><X size={16}/></button>}
            </div>
          )}
        </div>
        <button onClick={() => onRemove(item.id)} className="p-2 text-indigo-300 hover:text-red-500 transition-colors self-end pb-4"><Trash2 size={16} /></button>
      </div>
      <input type="text" placeholder="Dosage (e.g. 5ml)" className="w-full bg-white border-none rounded-lg p-2 text-xs outline-none" value={item.dosage} onChange={(e) => onUpdate(item.id, { dosage: e.target.value })} />
    </div>
  );
};

const MedicationList = ({ items, childMeds, onUpdate, onRemove }: { items: MedicationEntry[], childMeds: string[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm border-l-4 border-l-indigo-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Pill size={18} className="text-indigo-500" /> Medication</h3>
      <div className="space-y-4">{items.map(item => <MedicationItem key={item.id} item={item} childMeds={childMeds} onUpdate={onUpdate} onRemove={onRemove} />)}</div>
    </div>
  );
};

const MealList = ({ items, onUpdate, onRemove }: { items: MealEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-amber-50 p-6 shadow-sm border-l-4 border-l-amber-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Utensils size={18} className="text-amber-500" /> Meals</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-2xl">
            <div className="col-span-3">
              <input type="time" className="w-full bg-white border-none rounded-lg p-1 text-[10px] font-bold text-amber-600 outline-none" value={item.time} onChange={(e) => onUpdate(item.id, { time: e.target.value })} />
            </div>
            <select className="col-span-4 bg-white border-none rounded-lg p-1.5 text-[10px] font-medium outline-none" value={item.type} onChange={(e) => onUpdate(item.id, { type: e.target.value })}>
              {['Breakfast', 'Lunch', 'Snack', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Eaten..." className="col-span-4 bg-white border-none rounded-lg p-1.5 text-[10px] outline-none" value={item.items} onChange={(e) => onUpdate(item.id, { items: e.target.value })} />
            <button onClick={() => onRemove(item.id)} className="col-span-1 text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
            <div className="col-span-12 flex gap-1 mt-2">
              {(['All', 'Most', 'Some', 'Little'] as MealAmount[]).map(a => (
                <button key={a} onClick={() => onUpdate(item.id, { amount: a })} className={`flex-1 py-1 text-[9px] font-bold rounded-lg border transition-all ${item.amount === a ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-100 text-slate-400'}`}>{a}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BottleList = ({ items, onUpdate, onRemove }: { items: BottleEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-blue-50 p-6 shadow-sm border-l-4 border-l-blue-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Baby size={18} className="text-blue-500" /> Bottles</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-2xl">
            <input type="time" className="bg-white border-none rounded-lg p-1 text-[10px] font-bold text-blue-600 outline-none" value={item.time} onChange={(e) => onUpdate(item.id, { time: e.target.value })} />
            <select className="bg-white border-none rounded-lg p-1.5 text-[10px] flex-1 outline-none" value={item.type} onChange={(e) => onUpdate(item.id, { type: e.target.value })}>
              {['Milk', 'Formula', 'Water'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" className="bg-white border-none p-1.5 text-[10px] w-16 rounded-lg outline-none" value={item.amount} onChange={(e) => onUpdate(item.id, { amount: e.target.value })} />
            <button onClick={() => onRemove(item.id)} className="text-red-300"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NapList = ({ items, onUpdate, onRemove }: { items: NapEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-purple-50 p-6 shadow-sm border-l-4 border-l-purple-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Moon size={18} className="text-purple-500" /> Naps</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-purple-50/50 p-3 rounded-2xl space-y-2">
            <div className="flex gap-2">
              <input type="time" className="bg-white border-none p-1 text-[10px] font-bold text-purple-600 w-full rounded-lg outline-none" value={item.startTime} onChange={(e) => onUpdate(item.id, { startTime: e.target.value })} />
              <input type="time" className="bg-white border-none p-1 text-[10px] font-bold text-purple-600 w-full rounded-lg outline-none" value={item.endTime} onChange={(e) => onUpdate(item.id, { endTime: e.target.value })} />
              <button onClick={() => onRemove(item.id)} className="text-red-300"><Trash2 size={16} /></button>
            </div>
            <div className="flex gap-1">
              {(['Great', 'Okay', 'Restless'] as NapQuality[]).map(q => (
                <button key={q} onClick={() => onUpdate(item.id, { quality: q })} className={`flex-1 py-1 text-[9px] font-bold rounded-lg border transition-all ${item.quality === q ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-100 text-slate-400'}`}>{q}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DiaperList = ({ items, onUpdate, onRemove }: { items: DiaperPottyEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-emerald-50 p-6 shadow-sm border-l-4 border-l-emerald-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wind size={18} className="text-emerald-500" /> Diapers</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-emerald-50/50 p-3 rounded-2xl">
            <input type="time" className="bg-white border-none rounded-lg p-1 text-[10px] font-bold text-emerald-600 outline-none" value={item.time} onChange={(e) => onUpdate(item.id, { time: e.target.value })} />
            <div className="flex gap-1 flex-1">
              {(['Wet', 'BM', 'Both', 'Potty'] as DiaperType[]).map(t => (
                <button key={t} onClick={() => onUpdate(item.id, { type: t })} className={`flex-1 py-1 text-[9px] font-bold rounded-lg border transition-all ${item.type === t ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-100 text-slate-400'}`}>{t}</button>
              ))}
            </div>
            <button onClick={() => onRemove(item.id)} className="text-red-300"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogEntry;
