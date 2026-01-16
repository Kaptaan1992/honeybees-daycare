
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
  RefreshCw
} from 'lucide-react';
import { Store } from './store.ts';
import Dashboard from './pages/Dashboard.tsx';
import ChildrenManagement from './pages/ChildrenManagement.tsx';
import LogEntry from './pages/LogEntry.tsx';
import ReportPreview from './pages/ReportPreview.tsx';
import SettingsPage from './pages/Settings.tsx';
import HistoryPage from './pages/History.tsx';

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' 
          : 'text-slate-600 hover:bg-amber-50'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
      <span>{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkCloud = () => {
      setIsCloudEnabled(Store.isCloudEnabled());
    };
    checkCloud();
    
    // Periodically check or listen for settings changes
    const interval = setInterval(checkCloud, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await Store.syncLocalToCloud();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-amber-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-amber-100 shadow-sm fixed h-full p-4">
          <div className="flex items-center space-x-3 mb-10 px-4 pt-2">
            <div className="bg-amber-400 p-2 rounded-lg">
              <img src="https://img.icons8.com/color/48/bee.png" alt="logo" className="w-8 h-8" />
            </div>
            <h1 className="font-brand font-extrabold text-xl text-amber-900 tracking-tight">Honeybees</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/children" icon={Baby} label="Children" />
            <NavItem to="/history" icon={History} label="History" />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
          </nav>

          <div className="mt-auto space-y-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${isCloudEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              {isCloudEnabled ? <Cloud size={14}/> : <CloudOff size={14}/>}
              <span>{isCloudEnabled ? 'Cloud Sync Active' : 'Local Only Mode'}</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-800 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-slate-800">Admin Staff</p>
              </div>
              {isCloudEnabled && (
                <button 
                  onClick={handleManualSync}
                  className={`p-2 hover:bg-amber-100 rounded-full transition-all ${isSyncing ? 'animate-spin text-amber-600' : 'text-amber-400'}`}
                >
                  <RefreshCw size={14}/>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between w-full bg-white px-4 py-3 border-b border-amber-100 fixed top-0 z-50">
          <div className="flex items-center space-x-2">
            <img src="https://img.icons8.com/color/48/bee.png" alt="logo" className="w-6 h-6" />
            <span className="font-brand font-bold text-amber-900">Honeybees</span>
          </div>
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-full ${isCloudEnabled ? 'text-blue-500' : 'text-slate-300'}`}>
               {isCloudEnabled ? <Cloud size={18}/> : <CloudOff size={18}/>}
             </div>
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-white pt-16 px-4">
            <nav className="space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/children" icon={Baby} label="Children" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/history" icon={History} label="History" onClick={() => setIsMenuOpen(false)} />
              <NavItem to="/settings" icon={SettingsIcon} label="Settings" onClick={() => setIsMenuOpen(false)} />
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
          <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/children" element={<ChildrenManagement />} />
              <Route path="/log/:childId" element={<LogEntry />} />
              <Route path="/report/:childId/:date" element={<ReportPreview />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
