
import React, { useState, useEffect, useMemo } from 'react';
import { Store } from '../store';
import { DailyLog, Child } from '../types';
import { 
  Loader2,
  LineChart,
  Baby,
  Moon,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar
} from 'lucide-react';

const TrendsPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const allChildren = await Store.getChildren();
      const activeChildren = allChildren.filter(c => c.active);
      setChildren(activeChildren);
      if (activeChildren.length > 0) setSelectedChildId(activeChildren[0].id);
      
      setLogs(await Store.getDailyLogs());
      setIsLoading(false);
    };
    loadData();
  }, []);

  const childTrends = useMemo(() => {
    if (!selectedChildId) return null;

    // Get last 7 days of logs for this child
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i)); // Go from 6 days ago to today
      return d.toISOString().split('T')[0];
    });

    const data = last7Days.map(date => {
      const log = logs.find(l => l.childId === selectedChildId && l.date === date);
      
      // Calculate Milk Ounces
      const totalMilk = (log?.bottles || []).reduce((sum, b) => {
        const oz = parseInt(b.amount.replace(/\D/g, '')) || 0;
        return sum + oz;
      }, 0);

      // Calculate Nap Minutes
      const totalNapMinutes = (log?.naps || []).reduce((sum, n) => {
        if (!n.startTime || !n.endTime) return sum;
        try {
          const [sh, sm] = n.startTime.split(':').map(Number);
          const [eh, em] = n.endTime.split(':').map(Number);
          const start = sh * 60 + sm;
          const end = eh * 60 + em;
          return sum + (end > start ? end - start : 0);
        } catch { return sum; }
      }, 0);

      return {
        date,
        shortDate: date.split('-').slice(1).join('/'),
        milk: totalMilk,
        nap: totalNapMinutes,
        hasData: !!log
      };
    });

    const logsWithData = data.filter(d => d.hasData);
    const count = Math.max(logsWithData.length, 1);
    const avgMilk = logsWithData.reduce((a, b) => a + b.milk, 0) / count;
    const avgNap = logsWithData.reduce((a, b) => a + b.nap, 0) / count;

    return { data, avgMilk, avgNap };
  }, [selectedChildId, logs]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Analyzing Trends...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-2 px-2">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">Child Trends</h1>
        <p className="text-slate-500 text-sm font-medium">Tracking habits and growth patterns over time.</p>
      </header>

      {/* Child Horizontal Selector */}
      <section className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
        {/* Milk Trends Card */}
        <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl overflow-hidden">
          <div className="p-6 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <Baby size={18} className="text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-800">Milk Intake (oz)</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mb-1">7-Day Avg</p>
              <p className="text-lg font-black text-blue-700">{childTrends?.avgMilk.toFixed(1)} oz</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-48 gap-2 mb-4 px-2">
              {childTrends?.data.map((d, i) => {
                const maxVal = Math.max(...(childTrends.data.map(x => x.milk)), 40);
                // Ensure height is a valid number and at least 4% if data exists
                const heightPercent = d.hasData ? Math.max((d.milk / maxVal) * 100, 4) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                    <div className="w-full relative flex flex-col items-center justify-end h-full">
                      {d.hasData && d.milk > 0 && (
                        <div className="absolute -top-6 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                          {d.milk} oz
                        </div>
                      )}
                      <div 
                        className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                          d.hasData ? (d.milk > 0 ? 'bg-blue-400 group-hover:bg-blue-500 shadow-sm' : 'bg-blue-100') : 'bg-slate-50'
                        }`}
                        style={{ height: `${heightPercent}%`, minWidth: '8px' }}
                      ></div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">{d.shortDate}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">Daily consumption totals</p>
          </div>
        </div>

        {/* Nap Trends Card */}
        <div className="bg-white rounded-[2.5rem] border border-purple-100 shadow-xl overflow-hidden">
          <div className="p-6 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white p-2 rounded-xl shadow-sm">
                <Moon size={18} className="text-purple-600" />
              </div>
              <h3 className="font-extrabold text-slate-800">Nap Duration (min)</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-none mb-1">7-Day Avg</p>
              <p className="text-lg font-black text-purple-700">{Math.floor(childTrends?.avgNap || 0)} min</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-48 gap-2 mb-4 px-2">
              {childTrends?.data.map((d, i) => {
                const maxVal = Math.max(...(childTrends.data.map(x => x.nap)), 240);
                const heightPercent = d.hasData ? Math.max((d.nap / maxVal) * 100, 4) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                    <div className="w-full relative flex flex-col items-center justify-end h-full">
                      {d.hasData && d.nap > 0 && (
                        <div className="absolute -top-6 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                          {d.nap}m
                        </div>
                      )}
                      <div 
                        className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                          d.hasData ? (d.nap > 0 ? 'bg-purple-400 group-hover:bg-purple-500 shadow-sm' : 'bg-purple-100') : 'bg-slate-50'
                        }`}
                        style={{ height: `${heightPercent}%`, minWidth: '8px' }}
                      ></div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 whitespace-nowrap uppercase tracking-tighter">{d.shortDate}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">Total sleep time per day</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-100/50 p-6 rounded-3xl flex items-start gap-4 border border-amber-200 mx-2">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-amber-600 mt-1">
          <TrendingUp size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">Habit Monitoring</h4>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            Consistent bars indicate healthy routines. Sudden drops or spikes might signify growth spurts, teething, or changes in home schedule.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;
