
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Baby, 
  Settings as SettingsIcon, 
  History, 
  Menu, 
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Sparkles,
  CalendarCheck,
  ShieldAlert,
  Calendar,
  LineChart,
  Activity
} from 'lucide-react';
import { Store } from './store';
import Dashboard from './pages/Dashboard';
import ChildrenManagement from './pages/ChildrenManagement';
import LogEntry from './pages/LogEntry';
import ReportPreview from './pages/ReportPreview';
import SettingsPage from './pages/Settings';
import HistoryPage from './pages/History';
import AttendancePage from './pages/Attendance';
import EmergencyPage from './pages/Emergency';
import HolidayManagement from './pages/HolidayManagement';
import TrendsPage from './pages/Trends';
import Login from './pages/Login';

const NavItem = ({ to, icon: Icon, label, onClick, variant = 'default' }: { to: string, icon: any, label: string, onClick?: () => void, variant?: 'default' | 'emergency' }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  const colors = {
    default: {
      active: 'bg-amber-100 text-amber-900 font-bold shadow-sm',
      inactive: 'text-slate-600 hover:bg-amber-50',
      icon: isActive ? 'text-amber-600' : 'text-slate-400'
    },
    emergency: {
      active: 'bg-red-600 text-white font-bold shadow-lg shadow-red-100',
      inactive: 'text-red-600 hover:bg-red-50 font-bold',
      icon: isActive ? 'text-white' : 'text-red-500'
    }
  };

  const currentStyles = colors[variant];

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        isActive ? currentStyles.active : currentStyles.inactive
      }`}
    >
      <Icon size={20} className={currentStyles.icon} />
      <span>{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(Store.isAuthenticated());

  useEffect(() => {
    let subscription: any = null;

    const initCloudAndRealtime = async () => {
      const enabled = Store.isCloudEnabled();
      setIsCloudEnabled(enabled);
      
      if (enabled) {
        await Store.syncSettingsFromCloud();
        const client = Store.getClient();
        if (client) {
          // Join the public sync channel
          subscription = client
            .channel('honeybees_global_sync')
            .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
              console.log('☁️ Realtime Update Received:', payload.table);
              
              // Handle settings specifically as they affect app state
              if (payload.table === 'app_settings') {
                await Store.syncSettingsFromCloud();
              }
              
              setJustSynced(true);
              setTimeout(() => setJustSynced(false), 2000);
              
              // Notify all components that cloud data has changed
              window.dispatchEvent(new CustomEvent('hb_data_updated', { detail: payload }));
            })
            .subscribe((status) => {
              console.log('📡 Realtime Connection:', status);
              setIsRealtimeConnected(status === 'SUBSCRIBED');
            });
        }
      }
    };
    
    initCloudAndRealtime();

    // Watchdog to ensure we stay connected
    const interval = setInterval(() => {
      if (Store.isCloudEnabled() && !isRealtimeConnected) {
        initCloudAndRealtime();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (subscription) subscription.unsubscribe();
    };
  }, [isCloudEnabled, isRealtimeConnected]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await Store.syncLocalToCloud();
    window.dispatchEvent(new Event('hb_data_updated'));
    setTimeout(() => setIsSyncing(false), 1000);
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-amber-50">
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-amber-100 shadow-sm fixed h-full p-4 print:hidden">
          <div className="flex items-center space-x-3 mb-10 px-4 pt-2">
            <div className="bg-amber-400 p-2 rounded-lg">
              <img src="https://img.icons8.com/color/48/bee.png" alt="logo" className="w-8 h-8" />
            </div>
            <h1 className="font-brand font-extrabold text-xl text-amber-900 tracking-tight">Honeybees</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/children" icon={Baby} label="Children" />
            <NavItem to="/attendance" icon={CalendarCheck} label="Attendance" />
            <NavItem to="/trends" icon={LineChart} label="Trends" />
            <NavItem to="/closures" icon={Calendar} label="Closures" />
            <NavItem to="/history" icon={History} label="History" />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
            <div className="pt-4 mt-4 border-t border-slate-50">
               <NavItem to="/emergency" icon={ShieldAlert} label="Emergency" variant="emergency" />
            </div>
          </nav>

          <div className="mt-auto space-y-2">
            <div className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${isCloudEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                {isCloudEnabled ? <Cloud size={14}/> : <CloudOff size={14}/>}
                <span>{isCloudEnabled ? 'Cloud Sync' : 'Local Only'}</span>
              </div>
              {isCloudEnabled && (
                <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
              )}
            </div>
            
            <div className="p-4 bg-amber-50 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-800 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-slate-800">Admin Staff</p>
              </div>
              <div className="flex gap-1">
                {isCloudEnabled && (
                  <button 
                    onClick={handleManualSync}
                    className={`p-2 hover:bg-amber-100 rounded-full transition-all ${isSyncing || justSynced ? 'animate-spin text-amber-600' : 'text-amber-400'}`}
                  >
                    {justSynced ? <Activity size={14} className="text-green-500" /> : <RefreshCw size={14}/>}
                  </button>
                )}
                <button onClick={() => { Store.logout(); setIsAuthenticated(false); }} className="p-2 hover:bg-red-50 text-red-400 rounded-full">
                  <LogOut size={14}/>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
          <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/children" element={<ChildrenManagement />} />
              <Route path="/log/:childId" element={<LogEntry />} />
              <Route path="/report/:childId/:date" element={<ReportPreview />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/closures" element={<HolidayManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
