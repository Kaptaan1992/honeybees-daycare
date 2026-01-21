
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../store';
import { Child, DailyLog } from '../types';
import { getTodayDateStr, getCurrentTimeStr, format12h } from '../utils/dates';
import { 
  Search, 
  Utensils, 
  Moon, 
  AlertCircle,
  ClipboardList,
  Loader2,
  UserCheck,
  UserX,
  Baby,
  Smile,
  GraduationCap,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const currentDate = getTodayDateStr();
  const navigate = useNavigate();

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    else setIsSyncing(true);
    
    try {
      const allChildren = await Store.getChildren();
      const activeChildren = allChildren.filter(c => c.active);
      setChildren(activeChildren);

      const allLogs = await Store.getDailyLogs();
      const todayLogs: Record<string, DailyLog> = {};
      
      activeChildren.forEach(child => {
        const found = allLogs.find(l => l.childId === child.id && l.date === currentDate);
        if (found) todayLogs[child.id] = found;
      });
      
      setLogs(todayLogs);
    } catch (e) {
      console.error("Dashboard Sync Error:", e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData(true);
    
    // Listen for generic data updates
    const handleDataUpdate = () => loadData(false);
    
    // Listen for specific real-time log pushes from other devices
    const handleRealtimeLog = (e: any) => {
      const remoteLog = e.detail as DailyLog;
      if (remoteLog.date === currentDate) {
        setLogs(prev => ({ ...prev, [remoteLog.childId]: remoteLog }));
      }
    };

    window.addEventListener('hb_data_updated', handleDataUpdate);
    window.addEventListener('hb_log_synced', handleRealtimeLog);
    
    return () => {
      window.removeEventListener('hb_data_updated', handleDataUpdate);
      window.removeEventListener('hb_log_synced', handleRealtimeLog);
    };
  }, [loadData, currentDate]); 

  const handleCheckIn = async (childId: string) => {
    setIsSyncing(true);
    try {
      const nowTime = getCurrentTimeStr();
      const currentLog = await Store.getOrCreateDailyLog(childId, currentDate);
      
      const updatedLog: DailyLog = { 
        ...currentLog, 
        isPresent: true, 
        arrivalTime: nowTime,
        status: 'In Progress'
      };
      
      setLogs(prev => ({ ...prev, [childId]: updatedLog }));
      await Store.saveDailyLog(updatedLog);
    } catch (err) {
      console.error("Check-in failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCheckOut = async (childId: string) => {
    const log = logs[childId];
    if (!log) return;

    setIsSyncing(true);
    try {
      const nowTime = getCurrentTimeStr();
      const updatedLog: DailyLog = { 
        ...log, 
        departureTime: nowTime,
        status: 'Completed' 
      };
      
      setLogs(prev => ({ ...prev, [childId]: updatedLog }));
      await Store.saveDailyLog(updatedLog);
    } catch (err) {
      console.error("Check-out failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetStatus = async (childId: string) => {
    const log = logs[childId];
    if (!log) return;
    const child = children.find(c => c.id === childId);
    if (!window.confirm(`Undo check-in for ${child?.firstName}?`)) return;
    
    setIsSyncing(true);
    try {
      const updatedLog: DailyLog = { ...log, isPresent: false, status: 'In Progress' };
      setLogs(prev => ({ ...prev, [childId]: updatedLog }));
      await Store.saveDailyLog(updatedLog);
    } catch (err) { console.error(err); }
    finally { setIsSyncing(false); }
  };

  const filteredChildren = children.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedChildren = useMemo(() => {
    const order = ['Infants', 'Toddlers', 'Pre school'];
    const groups: Record<string, Child[]> = {};
    filteredChildren.forEach(child => {
      const room = child.classroom || 'Toddlers';
      if (!groups[room]) groups[room] = [];
      groups[room].push(child);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
    });
  }, [filteredChildren]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Loading Hive...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-brand font-extrabold text-amber-900">Today's Buzz</h1>
            {isSyncing && <RefreshCw size={14} className="text-amber-300 animate-spin" />}
          </div>
          <p className="text-slate-500 font-medium">
            {new Date(currentDate.replace(/-/g, '/')).toLocaleDateString('en-US', { 
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/emergency')}
            className="flex items-center gap-2 bg-red-600 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-red-100"
          >
            <ShieldAlert size={18} />
            <span className="text-xs uppercase">Emergency</span>
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-white border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-48 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {groupedChildren.map(([room, roomChildren]) => (
          <div key={room} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{room}</h2>
              <div className="h-px bg-slate-200 flex-1 ml-2 opacity-50"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {roomChildren.map(child => {
                const log = logs[child.id];
                const isPresent = !!log?.isPresent;
                const isCheckedOut = log?.status === 'Completed';

                return (
                  <div key={child.id} className={`bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-4 overflow-hidden shadow-sm ${
                    isPresent ? isCheckedOut ? 'border-blue-100 bg-blue-50/10' : 'border-amber-200' : 'border-slate-100 opacity-60'
                  }`}>
                    <div className="flex-1 p-4 flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                          isPresent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        {isPresent && !isCheckedOut && (
                          <div className="absolute -top-1 -right-1 flex items-center justify-center">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white shadow-sm"></span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold truncate ${isPresent ? 'text-slate-800' : 'text-slate-400'}`}>
                          {child.firstName} {child.lastName}
                        </h3>
                        {isPresent ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <StatusBadge count={log?.meals.length || 0} icon={Utensils} label="Meals" />
                            <StatusBadge count={log?.naps.length || 0} icon={Moon} label="Naps" />
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">In: {format12h(log?.arrivalTime)}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Awaiting arrival...</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 p-4 flex items-center gap-2">
                      {!isPresent ? (
                        <button onClick={() => handleCheckIn(child.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-amber-700 transition-all shadow-md">
                          <UserCheck size={18} />
                          <span>Check In</span>
                        </button>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/log/${child.id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-amber-200 text-amber-700 font-bold py-2.5 px-4 rounded-xl">
                            <ClipboardList size={18} />
                            <span>Log</span>
                          </button>
                          {isCheckedOut ? (
                            <button onClick={() => handleCheckIn(child.id)} className="flex-1 md:flex-none bg-blue-50 text-blue-600 font-bold py-2.5 px-4 rounded-xl">Undo Out</button>
                          ) : (
                            <button onClick={() => handleCheckOut(child.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-100">
                              <LogOut size={18} />
                              <span>Out</span>
                            </button>
                          )}
                          <button onClick={() => handleResetStatus(child.id)} className="p-2.5 text-slate-300 hover:text-red-500"><UserX size={18} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ count, icon: Icon }: { count: number, icon: any, label: string }) => (
  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
    count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
  }`}>
    <Icon size={10} />
    <span>{count}</span>
  </div>
);

export default Dashboard;
