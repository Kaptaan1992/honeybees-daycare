
import React, { useState, useEffect } from 'react';
import { Store } from '../store';
import { DailyLog, Child } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Loader2,
  CalendarCheck,
  CheckCircle2,
  User,
  Users
} from 'lucide-react';

const AttendancePage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  // Current Month/Year for view
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const allChildren = await Store.getChildren();
    const activeChildren = allChildren.filter(c => c.active);
    setChildren(activeChildren);
    if (activeChildren.length > 0) setSelectedChildId(activeChildren[0].id);
    
    setLogs(await Store.getDailyLogs());
    setIsLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);
  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const getStatus = (childId: string, day: number) => {
    const dateStr = `${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = logs.find(l => l.childId === childId && l.date === dateStr);
    return log?.isPresent;
  };

  const getMonthlyTotal = (childId: string) => {
    const monthPrefix = `${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    return logs.filter(l => l.childId === childId && l.date.startsWith(monthPrefix) && l.isPresent).length;
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Loading Attendance...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto">
      <header className="flex flex-col gap-2 print:hidden px-2">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">Attendance</h1>
        <p className="text-slate-500 text-sm font-medium">Child-by-child monthly tracking.</p>
      </header>

      {/* Child Horizontal Selector */}
      <section className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide print:hidden">
        {children.map(child => (
          <button
            key={child.id}
            onClick={() => setSelectedChildId(child.id)}
            className={`flex flex-col items-center gap-2 shrink-0 transition-all ${
              selectedChildId === child.id ? 'scale-110' : 'opacity-50 grayscale'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border-2 ${
              selectedChildId === child.id ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-slate-100 text-slate-400'
            }`}>
              {child.firstName[0]}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">{child.firstName}</span>
          </button>
        ))}
      </section>

      {/* Month Navigator */}
      <section className="bg-white rounded-3xl border border-amber-100 p-4 shadow-sm flex items-center justify-between mx-2">
        <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-amber-600">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{year}</p>
          <h2 className="text-lg font-extrabold text-slate-800">{monthName}</h2>
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-amber-600">
          <ChevronRight size={20} />
        </button>
      </section>

      {/* The Vertical Mini-Calendar */}
      <div className="bg-white rounded-[2.5rem] border border-amber-100 shadow-xl overflow-hidden mx-2">
        <div className="p-6 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <CalendarCheck size={18} className="text-amber-600" />
            </div>
            <div>
               <h3 className="font-extrabold text-slate-800 leading-none">{selectedChild?.firstName}'s Log</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Monthly Calendar View</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-amber-600 print:hidden">
            <Printer size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className="text-[10px] font-black text-slate-300 uppercase">{day}</span>
            ))}
            
            {/* Calendar Padding */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            
            {/* Days Grid */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isPresent = getStatus(selectedChildId!, day);
              return (
                <div 
                  key={day}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border ${
                    isPresent 
                      ? 'bg-amber-400 border-amber-500 text-white shadow-sm scale-105' 
                      : 'bg-slate-50 border-transparent text-slate-300'
                  }`}
                >
                  <span className={`text-xs font-bold ${isPresent ? 'text-amber-900' : ''}`}>{day}</span>
                  {isPresent && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <img src="https://img.icons8.com/color/16/bee.png" alt="bee" className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Present</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-amber-600">{getMonthlyTotal(selectedChildId!)}</span>
                <span className="text-xs text-slate-400 font-bold">/ {daysInMonth}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col justify-center">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Present</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-100/50 p-6 rounded-3xl flex items-center gap-4 border border-amber-200 mx-2 print:hidden">
        <div className="w-10 h-10 bg-amber-200 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
          <Users size={20} />
        </div>
        <p className="text-xs text-amber-900/80 font-medium leading-relaxed">
          Select a child from the list above to view their specific attendance patterns. Use the print icon to export individual records.
        </p>
      </div>
    </div>
  );
};

export default AttendancePage;
