
import React, { useState, useEffect } from 'react';
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
  Pill
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

const LogEntry: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      if (!childId) return;
      setIsLoading(true);
      const allChildren = await Store.getChildren();
      const foundChild = allChildren.find(c => c.id === childId);
      if (foundChild) {
        setChild(foundChild);
        const dailyLog = await Store.getOrCreateDailyLog(childId, today);
        setLog(dailyLog);
      }
      setIsLoading(false);
    };
    loadData();
  }, [childId, today]);

  const updateLog = async (updates: Partial<DailyLog>) => {
    if (!log) return;
    const newLog = { ...log, ...updates };
    setLog(newLog);
    const allLogs = await Store.getDailyLogs();
    const index = allLogs.findIndex(l => l.id === log.id);
    if (index !== -1) {
      allLogs[index] = newLog;
    } else {
      allLogs.push(newLog);
    }
    await Store.saveDailyLogs(allLogs);
  };

  const getCurrentTime24 = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const addMeal = () => {
    const meal: MealEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: getCurrentTime24(),
      type: 'Snack',
      items: '',
      amount: 'All'
    };
    updateLog({ meals: [...log!.meals, meal] });
  };

  const addBottle = () => {
    const bottle: BottleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: getCurrentTime24(),
      type: 'Milk',
      amount: '6oz'
    };
    updateLog({ bottles: [...log!.bottles, bottle] });
  };

  const addNap = () => {
    const nap: NapEntry = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: getCurrentTime24(),
      endTime: '',
      quality: 'Great'
    };
    updateLog({ naps: [...log!.naps, nap] });
  };

  const addDiaper = () => {
    const diaper: DiaperPottyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: getCurrentTime24(),
      type: 'Wet'
    };
    updateLog({ diapers: [...log!.diapers, diaper] });
  };

  const addActivity = () => {
    const activity: ActivityEntry = {
      id: Math.random().toString(36).substr(2, 9),
      category: 'Free Play',
      description: ''
    };
    updateLog({ activities: [...log!.activities, activity] });
  };

  const addMedication = () => {
    const med: MedicationEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: getCurrentTime24(),
      name: '',
      dosage: ''
    };
    updateLog({ medications: [...(log!.medications || []), med] });
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
          <p className="text-sm text-slate-500 font-medium">{new Date(today).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Overall Mood</label>
          <div className="flex gap-2">
            {(['Great', 'Good', 'Okay', 'Not Great'] as Mood[]).map(m => (
              <button
                key={m}
                onClick={() => updateLog({ overallMood: m })}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  log.overallMood === m 
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm scale-[1.02]' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-amber-200'
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
              <input 
                type="time" 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-400 text-sm"
                value={log.arrivalTime}
                onChange={(e) => updateLog({ arrivalTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Check Out ({format12h(log.departureTime)})</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="time" 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-400 text-sm"
                value={log.departureTime}
                onChange={(e) => updateLog({ departureTime: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Add Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <ActionButton icon={Utensils} label="Meal" color="amber" onClick={addMeal} />
        <ActionButton icon={Baby} label="Bottle" color="blue" onClick={addBottle} />
        <ActionButton icon={Moon} label="Nap" color="purple" onClick={addNap} />
        <ActionButton icon={Wind} label="Diaper" color="emerald" onClick={addDiaper} />
        <ActionButton icon={Palette} label="Activity" color="rose" onClick={addActivity} />
        <ActionButton icon={Pill} label="Meds" color="indigo" onClick={addMedication} />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        <MedicationList 
          items={log.medications || []} 
          onUpdate={(id, updates) => updateEntry('medications', id, updates)} 
          onRemove={(id) => removeEntry('medications', id)} 
        />
        <ActivityList 
          items={log.activities} 
          onUpdate={(id, updates) => updateEntry('activities', id, updates)} 
          onRemove={(id) => removeEntry('activities', id)} 
        />
        <MealList 
          items={log.meals} 
          onUpdate={(id, updates) => updateEntry('meals', id, updates)} 
          onRemove={(id) => removeEntry('meals', id)} 
        />
        <BottleList 
          items={log.bottles} 
          onUpdate={(id, updates) => updateEntry('bottles', id, updates)} 
          onRemove={(id) => removeEntry('bottles', id)} 
        />
        <NapList 
          items={log.naps} 
          onUpdate={(id, updates) => updateEntry('naps', id, updates)} 
          onRemove={(id) => removeEntry('naps', id)} 
        />
        <DiaperList 
          items={log.diapers} 
          onUpdate={(id, updates) => updateEntry('diapers', id, updates)} 
          onRemove={(id) => removeEntry('diapers', id)} 
        />
      </div>

      {/* Notes & Supplies */}
      <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Teacher's Notes</label>
          <textarea 
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 min-h-[100px] text-sm"
            placeholder="How was their day? Any special moments?"
            value={log.teacherNotes}
            onChange={(e) => updateLog({ teacherNotes: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Supplies Needed</label>
          <input 
            type="text"
            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-400 text-sm"
            placeholder="e.g. More diapers, extra clothes"
            value={log.suppliesNeeded}
            onChange={(e) => updateLog({ suppliesNeeded: e.target.value })}
          />
        </div>
      </section>

      {/* Persistent CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-gradient-to-t from-amber-50 to-transparent flex justify-center">
        <button 
          onClick={() => navigate(`/report/${childId}/${today}`)}
          className="w-full max-w-2xl flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-amber-200 transition-all transform hover:scale-[1.02] active:scale-95"
        >
          <Send size={20} />
          <span>Preview & Send Daily Report</span>
        </button>
      </div>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-2xl border border-transparent shadow-sm hover:shadow-md transition-all active:scale-95 ${colors[color]}`}
    >
      <div className="mb-1"><Icon size={18} /></div>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
};

const MedicationList = ({ items, onUpdate, onRemove }: { items: MedicationEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm border-l-4 border-l-indigo-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Pill size={18} className="text-indigo-500" />
        Medication
      </h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-indigo-50/30 p-3 rounded-2xl">
            <div className="col-span-3">
              <div className="text-[8px] font-bold text-indigo-400 uppercase ml-1 mb-0.5">{format12h(item.time)}</div>
              <input 
                type="time" 
                className="w-full bg-white border-none rounded-lg p-1 text-xs font-bold text-indigo-600"
                value={item.time}
                onChange={(e) => onUpdate(item.id, { time: e.target.value })}
              />
            </div>
            <input 
              type="text" 
              placeholder="Name"
              className="col-span-4 bg-white border-none rounded-lg p-1.5 text-xs font-bold text-slate-700"
              value={item.name}
              onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            />
            <input 
              type="text" 
              placeholder="Dosage"
              className="col-span-4 bg-white border-none rounded-lg p-1.5 text-xs"
              value={item.dosage}
              onChange={(e) => onUpdate(item.id, { dosage: e.target.value })}
            />
            <button onClick={() => onRemove(item.id)} className="col-span-1 p-1.5 text-indigo-300 hover:text-indigo-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityList = ({ items, onUpdate, onRemove }: { items: ActivityEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  const categories = ['Tummy Time', 'Outdoors Play', 'Singing', 'Storytime', 'Art', 'Circle Time', 'Sensory', 'Free Play', 'Other'];
  
  return (
    <div className="bg-white rounded-3xl border border-rose-50 p-6 shadow-sm border-l-4 border-l-rose-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-rose-500" />
        Activities
      </h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-rose-50/30 p-3 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <select 
                className="flex-1 bg-white border-none rounded-lg p-1.5 text-xs font-bold text-slate-700"
                value={item.category}
                onChange={(e) => onUpdate(item.id, { category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => onRemove(item.id)} className="p-1.5 text-rose-300 hover:text-rose-500">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              placeholder="Tell the parents about this activity..."
              className="w-full bg-white border-none rounded-xl p-3 text-xs min-h-[60px]"
              value={item.description}
              onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const MealList = ({ items, onUpdate, onRemove }: { items: MealEntry[], onUpdate: (id: string, updates: any) => void, onRemove: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-amber-50 p-6 shadow-sm border-l-4 border-l-amber-400">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Utensils size={18} className="text-amber-500" />
        Meals
      </h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-2xl relative group">
            <div className="col-span-3">
              <div className="text-[8px] font-bold text-amber-400 uppercase ml-1 mb-0.5">{format12h(item.time)}</div>
              <input 
                type="time" 
                className="w-full bg-white border-none rounded-lg p-1 text-xs font-bold text-amber-600"
                value={item.time}
                onChange={(e) => onUpdate(item.id, { time: e.target.value })}
              />
            </div>
            <select 
              className="col-span-4 bg-white border-none rounded-lg p-1.5 text-xs font-medium"
              value={item.type}
              onChange={(e) => onUpdate(item.id, { type: e.target.value })}
            >
              {['Breakfast', 'Lunch', 'Snack', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Items eaten..."
              className="col-span-5 bg-white border-none rounded-lg p-1.5 text-xs"
              value={item.items}
              onChange={(e) => onUpdate(item.id, { items: e.target.value })}
            />
            <div className="col-span-12 flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Amount:</span>
              <div className="flex gap-1 flex-1">
                {(['All', 'Most', 'Some', 'Little'] as MealAmount[]).map(a => (
                  <button 
                    key={a}
                    onClick={() => onUpdate(item.id, { amount: a })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                      item.amount === a ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button onClick={() => onRemove(item.id)} className="p-1.5 text-red-300 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
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
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Baby size={18} className="text-blue-500" />
        Bottles
      </h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-blue-50/50 p-3 rounded-2xl">
            <div className="col-span-3">
              <div className="text-[8px] font-bold text-blue-400 uppercase ml-1 mb-0.5">{format12h(item.time)}</div>
              <input 
                type="time" 
                className="w-full bg-white border-none rounded-lg p-1 text-xs font-bold text-blue-600"
                value={item.time}
                onChange={(e) => onUpdate(item.id, { time: e.target.value })}
              />
            </div>
            <select 
              className="col-span-4 bg-white border-none rounded-lg p-1.5 text-xs font-medium"
              value={item.type}
              onChange={(e) => onUpdate(item.id, { type: e.target.value })}
            >
              {['Milk', 'Formula', 'Water', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="col-span-4 flex items-center bg-white rounded-lg px-2">
              <input 
                type="text" 
                className="w-full bg-transparent border-none p-1.5 text-xs"
                value={item.amount}
                onChange={(e) => onUpdate(item.id, { amount: e.target.value })}
              />
            </div>
            <button onClick={() => onRemove(item.id)} className="col-span-1 p-1.5 text-red-300 hover:text-red-500 text-right">
              <Trash2 size={16} />
            </button>
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
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Moon size={18} className="text-purple-500" />
        Naps
      </h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-purple-50/50 p-3 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-[8px] font-bold text-purple-400 uppercase ml-1">Start: {format12h(item.startTime)}</div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg">
                  <input 
                    type="time" 
                    className="bg-transparent border-none p-1 text-xs font-bold text-purple-600 w-full"
                    value={item.startTime}
                    onChange={(e) => onUpdate(item.id, { startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-[8px] font-bold text-purple-400 uppercase ml-1">End: {format12h(item.endTime)}</div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg">
                  <input 
                    type="time" 
                    className="bg-transparent border-none p-1 text-xs font-bold text-purple-600 w-full"
                    value={item.endTime}
                    onChange={(e) => onUpdate(item.id, { endTime: e.target.value })}
                  />
                </div>
              </div>
              <button onClick={() => onRemove(item.id)} className="ml-auto p-1.5 text-red-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex gap-1">
              {(['Great', 'Okay', 'Restless'] as NapQuality[]).map(q => (
                <button 
                  key={q}
                  onClick={() => onUpdate(item.id, { quality: q })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    item.quality === q ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  {q}
                </button>
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
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Wind size={18} className="text-emerald-500" />
        Diapers
      </h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <div className="text-[8px] font-bold text-emerald-400 uppercase ml-1">{format12h(item.time)}</div>
              <input 
                type="time" 
                className="bg-white border-none rounded-lg p-1 text-xs font-bold text-emerald-600"
                value={item.time}
                onChange={(e) => onUpdate(item.id, { time: e.target.value })}
              />
            </div>
            <div className="flex gap-1 flex-1">
              {(['Wet', 'BM', 'Both', 'Potty'] as DiaperType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => onUpdate(item.id, { type: t })}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    item.type === t ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => onRemove(item.id)} className="p-1.5 text-red-300 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogEntry;
