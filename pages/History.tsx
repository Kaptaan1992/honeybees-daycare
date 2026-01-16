
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../store';
import { DailyLog, Child, EmailSendLog } from '../types';
import { Calendar, Eye, Send, Filter, CheckCircle, Loader2, Trash2 } from 'lucide-react';

const format12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours);
  const m = minutes || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};

const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [sendLogs, setSendLogs] = useState<EmailSendLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const allLogs = await Store.getDailyLogs();
    setLogs(allLogs.sort((a, b) => b.date.localeCompare(a.date)));
    setChildren(await Store.getChildren());
    setSendLogs(await Store.getSendLogs());
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this daily report? This action cannot be undone.')) {
      await Store.deleteDailyLog(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-brand font-extrabold text-amber-900">History</h1>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-xl border border-amber-100 text-slate-400 hover:text-amber-600 shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-900/40">
           <Loader2 className="animate-spin mb-4" size={32} />
           <p className="font-bold uppercase tracking-widest text-[10px]">Fetching History...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-amber-50 text-amber-900/50 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Child</th>
                  <th className="px-6 py-4">Mood</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {logs.map(log => {
                  const child = children.find(c => c.id === log.childId);
                  const sendStatus = sendLogs.find(sl => sl.dailyLogId === log.id);

                  return (
                    <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Calendar size={14} className="text-amber-500" />
                          {log.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{child?.firstName} {child?.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{child?.classroom}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {log.overallMood}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {sendStatus ? (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
                              <CheckCircle size={10} /> Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase">
                               Draft
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/report/${log.childId}/${log.date}`)}
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                            title="View Report"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => navigate(`/log/${log.childId}`)}
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit Log"
                          >
                            <Send size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(log.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                      No history logs found yet. Start by logging today's activities!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
