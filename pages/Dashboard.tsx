
import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const allChildren = await Store.getChildren();
      const activeChildren = allChildren.filter(c => c.active);
      setChildren(activeChildren);

      const todayLogs: Record<string, DailyLog> = {};
      for (const child of activeChildren) {
        todayLogs[child.id] = await Store.getOrCreateDailyLog(child.id, today);
      }
      setLogs(todayLogs);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredChildren = children.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-brand font-extrabold text-amber-900">Today's Buzz</h1>
          <p className="text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search children..." 
            className="pl-10 pr-4 py-2 bg-white border border-amber-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-64 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-900/40">
           <Loader2 className="animate-spin mb-4" size={32} />
           <p className="font-bold uppercase tracking-widest text-[10px]">Syncing with Cloud...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
          {filteredChildren.map(child => {
            const log = logs[child.id];
            return (
              <div 
                key={child.id}
                onClick={() => navigate(`/log/${child.id}`)}
                className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xl uppercase">
                  {child.firstName[0]}{child.lastName[0]}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{child.firstName} {child.lastName}</h3>
                    {child.allergies && (
                      <span className="p-1 bg-red-50 text-red-600 rounded-md" title={`Allergies: ${child.allergies}`}>
                        <AlertCircle size={14} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge count={log?.meals.length || 0} icon={Utensils} label="Meals" />
                    <StatusBadge count={log?.naps.length || 0} icon={Moon} label="Naps" />
                    <StatusBadge count={log?.diapers.length || 0} icon={ClipboardList} label="Diapers" />
                  </div>
                </div>

                <div className="text-slate-300 group-hover:text-amber-500 transition-colors">
                  <ChevronRight />
                </div>
              </div>
            );
          })}

          {filteredChildren.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-amber-200">
              <p className="text-slate-400 font-medium">No children found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ count, icon: Icon, label }: { count: number, icon: any, label: string }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
    count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
  }`}>
    <Icon size={12} />
    <span>{count} {label}</span>
  </div>
);

export default Dashboard;
