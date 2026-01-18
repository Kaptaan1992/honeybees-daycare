
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../store';
import { Child, DailyLog } from '../types';
import { 
  Search, 
  Utensils, 
  Moon, 
  ChevronRight, 
  AlertCircle,
  ClipboardList,
  Loader2,
  UserCheck,
  UserX,
  LogOut,
  Baby,
  Smile,
  GraduationCap,
  ShieldAlert
} from 'lucide-react';

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayDateStr());
  const navigate = useNavigate();

  const loadData = useCallback(async (dateToLoad: string) => {
    setIsLoading(true);
    const allChildren = await Store.getChildren();
    const activeChildren = allChildren.filter(c => c.active);
    setChildren(activeChildren);

    const todayLogs: Record<string, DailyLog> = {};
    for (const child of activeChildren) {
      todayLogs[child.id] = await Store.getOrCreateDailyLog(child.id, dateToLoad);
    }
    setLogs(todayLogs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(currentDate);
    const interval = setInterval(() => {
      const nowStr = getTodayDateStr();
      if (nowStr !== currentDate) setCurrentDate(nowStr);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDate, loadData]);

  const handleCheckIn = async (childId: string) => {
    const currentLog = logs[childId];
    if (!currentLog) return;
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const updatedLog: DailyLog = { 
      ...currentLog, 
      isPresent: true, 
      arrivalTime: nowTime,
      status: 'In Progress'
    };
    await saveLog(childId, updatedLog);
  };

  const handleCheckOut = async (childId: string) => {
    const currentLog = logs[childId];
    if (!currentLog) return;
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const updatedLog: DailyLog = { 
      ...currentLog, 
      departureTime: nowTime,
      status: 'Completed' 
    };
    await saveLog(childId, updatedLog);
  };

  /**
   * ROBUST UNDO ALL:
   * Overwrites the current log with a blank one where isPresent is false.
   * This clears all sub-arrays and data points for the day.
   */
  const handleResetStatus = async (childId: string) => {
    const currentLog = logs[childId];
    if (!currentLog) return;

    const child = children.find(c => c.id === childId);
    if (!window.confirm(`Wipe all data for ${child?.firstName} for today? This child will be marked absent.`)) return;
    
    // Create a perfectly blank version of the current log
    const blankLog: DailyLog = { 
      id: currentLog.id, 
      childId: childId,
      date: currentDate,
      isPresent: false, 
      status: 'In Progress',
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
      incidents: []
    };
    
    // Update state immediately for instant feedback
    setLogs(prev => ({ ...prev, [childId]: blankLog }));
    
    // Persist the blank overwrite to local and cloud
    await Store.saveDailyLog(blankLog);
  };

  const saveLog = async (childId: string, updatedLog: DailyLog) => {
    // UI feedback first
    setLogs(prev => ({ ...prev, [childId]: updatedLog }));
    // Then save
    await Store.saveDailyLog(updatedLog);
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

  const checkedInCount = (Object.values(logs) as DailyLog[]).filter(l => l.isPresent).length;

  const getRoomIcon = (room: string) => {
    switch (room) {
      case 'Infants': return <Baby size={18} className="text-rose-500" />;
      case 'Pre school': return <GraduationCap size={18} className="text-blue-500" />;
      default: return <Smile size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-brand font-extrabold text-amber-900">Today's Buzz</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 font-medium">
              {new Date(currentDate.replace(/-/g, '/')).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </p>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <p className="text-amber-600 font-bold text-sm">{checkedInCount} / {children.length} Here Today</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/emergency')}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95"
          >
            <ShieldAlert size={18} />
            <span className="text-xs uppercase tracking-tight">Emergency Info</span>
          </button>
          
          <div className="relative hidden sm:block">
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-900/40">
           <Loader2 className="animate-spin mb-4" size={32} />
           <p className="font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-500">
          {groupedChildren.length > 0 ? groupedChildren.map(([room, roomChildren]) => (
            <div key={room} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  {getRoomIcon(room)}
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{room}</h2>
                <div className="h-px bg-slate-200 flex-1 ml-2 opacity-50"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roomChildren.length} Kids</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {roomChildren.map(child => {
                  const log = logs[child.id];
                  const isPresent = log?.isPresent;
                  const isCheckedOut = log?.status === 'Completed';

                  return (
                    <div 
                      key={child.id}
                      className={`bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-4 overflow-hidden shadow-sm ${
                        isPresent 
                          ? isCheckedOut ? 'border-blue-200 bg-blue-50/10' : 'border-amber-200 shadow-md' 
                          : 'border-slate-100 opacity-60 grayscale-[0.5]'
                      }`}
                    >
                      <div 
                        className="flex-1 p-4 flex items-center gap-4 cursor-pointer"
                        onClick={() => isPresent ? navigate(`/log/${child.id}`) : null}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg uppercase shrink-0 transition-all ${
                          isPresent 
                            ? isCheckedOut ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {child.firstName[0]}{child.lastName[0]}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-lg font-bold ${isPresent ? 'text-slate-800' : 'text-slate-400'}`}>
                              {child.firstName} {child.lastName}
                            </h3>
                            {child.allergies && <AlertCircle size={14} className="text-red-400" />}
                            {isPresent && !isCheckedOut && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            )}
                            {isCheckedOut && (
                              <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Departed</span>
                            )}
                          </div>
                          {isPresent && (
                            <div className="space-y-2 mt-2">
                              {child.allergies && (
                                <div className="bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl flex items-center gap-2 animate-in slide-in-from-left duration-300">
                                  <AlertCircle size={12} className="text-red-500 shrink-0" />
                                  <span className="text-[9px] font-black text-red-700 uppercase tracking-tighter">Allergies: {child.allergies}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge count={log?.meals.length || 0} icon={Utensils} label="Meals" />
                                <StatusBadge count={log?.naps.length || 0} icon={Moon} label="Naps" />
                                <StatusBadge count={log?.activities.length || 0} icon={ClipboardList} label="Acts" />
                              </div>
                            </div>
                          )}
                          {!isPresent && (
                            <p className="text-xs text-slate-400 italic mt-1 font-medium">Not checked in today</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 p-3 md:p-6 flex items-center gap-2 justify-center">
                        {!isPresent ? (
                          <button 
                            onClick={() => handleCheckIn(child.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-amber-700 transition-all"
                          >
                            <UserCheck size={18} />
                            <span>Check In</span>
                          </button>
                        ) : (
                          <>
                              {!isCheckedOut ? (
                                <button 
                                  onClick={() => handleCheckOut(child.id)}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-600 transition-all shadow-sm"
                                >
                                  <LogOut size={18} />
                                  <span>Check Out</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleCheckIn(child.id)} 
                                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 font-bold py-2.5 px-6 rounded-xl hover:bg-blue-50 transition-all"
                                >
                                  <span>Undo Out</span>
                                </button>
                              )}
                              <button 
                                onClick={() => handleResetStatus(child.id)}
                                className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                                title="Undo All (Total Wipe)"
                              >
                                <UserX size={18} />
                              </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )) : (
            <div className="text-center py-20 text-slate-400">
               <div className="flex justify-center mb-4 opacity-20"><Search size={48} /></div>
               <p className="italic">No children found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ count, icon: Icon, label }: { count: number, icon: any, label: string }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
    count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400 opacity-50'
  }`}>
    <Icon size={10} />
    <span>{count}</span>
  </div>
);

export default Dashboard;
