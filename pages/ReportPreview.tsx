
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store } from '../store';
import { generateDailySummary } from '../services/gemini';
import { generateEmailBody, generateHtmlEmailBody } from '../services/email_template';
import { 
  Child, 
  Parent, 
  DailyLog, 
  Settings,
  Holiday,
  EmailSendLog
} from '../types';
import { 
  ArrowLeft, 
  Mail, 
  Sparkles, 
  CheckCircle2,
  Printer,
  Send,
  Loader2,
  Copy,
  LineChart,
  AlertCircle
} from 'lucide-react';

const ReportPreview: React.FC = () => {
  const { childId, date } = useParams<{ childId: string, date: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [settings, setSettings] = useState<Settings>(Store.getSettings());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSentSuccessfully, setIsSentSuccessfully] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendCopyToSelf, setSendCopyToSelf] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!childId || !date) {
        setError("Missing child or date info.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const children = await Store.getChildren();
        const foundChild = children.find(c => c.id === childId);
        if (!foundChild) {
          setError("Child not found.");
          return;
        }
        const dailyLog = await Store.getOrCreateDailyLog(childId, date);
        const allParents = await Store.getParents();
        const appSettings = Store.getSettings();
        const allHolidays = await Store.getHolidays();
        const logs = await Store.getDailyLogs();
        
        setChild(foundChild);
        setLog(dailyLog);
        setSettings(appSettings);
        setHolidays(allHolidays);
        setAllLogs(logs);
        setSendCopyToSelf(appSettings.sendCopyToSelfDefault || false);
        setParents(allParents.filter(p => foundChild.parentIds.includes(p.id)));
        setAiSummary(dailyLog.teacherNotes || "");
      } catch (err) {
        console.error(err);
        setError("Error loading report.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [childId, date]);

  const toggleTrends = async () => {
    if (!log) return;
    const updated = { ...log, includeTrends: !log.includeTrends };
    setLog(updated);
    await Store.saveDailyLog(updated);
  };

  const handleGenerateAISummary = async () => {
    if (!log || !child || parents.length === 0) return;
    setIsGenerating(true);
    try {
      const summary = await generateDailySummary(log, child, parents[0]);
      setAiSummary(summary);
    } catch (err) { console.error(err); }
    finally { setIsGenerating(false); }
  };

  const emailSubject = `Daily Report – ${child?.firstName} – ${date}`;
  const emailContentText = log && child ? generateEmailBody(log, child, settings, aiSummary, holidays) : '';
  const emailContentHtml = log && child ? generateHtmlEmailBody(log, child, settings, aiSummary, holidays, allLogs) : '';

  const activeRecipients = parents.filter(p => p.receivesEmail);

  const handleSendEmail = async (isTest = false) => {
    let recipients = isTest ? [settings.testEmail || settings.fromEmail] : activeRecipients.map(p => p.email);
    if (!isTest && sendCopyToSelf && settings.fromEmail) recipients.push(settings.fromEmail);
    recipients = Array.from(new Set(recipients)).filter(Boolean);

    if (recipients.length === 0) {
      alert("No recipients! Go to Children management to link parents or enable 'Receive Reports' for them.");
      return;
    }

    setIsSending(true);
    let success = false;

    if (settings.emailjsPublicKey) {
      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: settings.emailjsServiceId,
            template_id: settings.emailjsTemplateId,
            user_id: settings.emailjsPublicKey,
            template_params: {
              to_email: recipients.join(', '),
              child_name: child!.firstName,
              subject: emailSubject,
              message: emailContentText,
              html_message: emailContentHtml,
              daycare_name: settings.daycareName
            }
          })
        });
        if (response.ok) {
          success = true;
        }
      } catch (e) { 
        console.error(e);
        alert("Failed to send via EmailJS. Check your settings.");
      }
    } else {
      const mailto = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContentText)}`;
      window.open(mailto);
      success = true; // For mailto we assume success once opened
    }

    if (success && !isTest) {
      const updatedLog: DailyLog = { ...log!, status: 'Sent' };
      await Store.saveDailyLog(updatedLog);
      setLog(updatedLog);
      
      const sendLogRecord: EmailSendLog = {
        id: Math.random().toString(36).substr(2, 9),
        dailyLogId: log!.id,
        sentTo: recipients,
        subject: emailSubject,
        sentAt: new Date().toISOString(),
        status: 'Sent'
      };
      await Store.saveSendLog(sendLogRecord);
      
      window.dispatchEvent(new Event('hb_data_updated'));
      setIsSentSuccessfully(true);
    }
    
    setIsSending(false);
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (error) return <div className="p-20 text-center">{error}</div>;

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/log/${childId}`)} className="p-3 -ml-2 text-slate-400 hover:text-amber-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-brand font-extrabold text-amber-900">Review Report</h1>
        <div className="w-10" />
      </div>

      {isSentSuccessfully ? (
        <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-xl border border-amber-100 space-y-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={40} /></div>
          <h2 className="text-2xl font-brand font-extrabold text-slate-800">Report Sent!</h2>
          <button onClick={() => navigate('/')} className="mt-6 bg-amber-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-amber-200">Back to Dashboard</button>
        </div>
      ) : (
        <>
          <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Report Options</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl text-purple-600 shadow-sm">
                    <LineChart size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Include Weekly Trends</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">7-day milk & nap averages</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-purple-600 rounded-lg"
                  checked={log?.includeTrends || false} 
                  onChange={toggleTrends} 
                />
              </label>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                   <p className="text-xs font-bold text-slate-400 uppercase">Recipients</p>
                   {activeRecipients.length === 0 && (
                     <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                       <AlertCircle size={10}/> No Active Recipients
                     </div>
                   )}
                </div>
                {parents.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{p.fullName}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.receivesEmail ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`} title={p.receivesEmail ? 'Active recipient' : 'Email disabled'}>
                      <Mail size={16} />
                    </div>
                  </div>
                ))}
                {parents.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No parents linked yet.</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-white rounded-[2.5rem] border border-amber-100 shadow-sm overflow-hidden p-6 bg-slate-50">
               <div className="max-w-[420px] mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200" dangerouslySetInnerHTML={{ __html: emailContentHtml }} />
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleGenerateAISummary} disabled={isGenerating} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-black py-5 rounded-2xl border border-indigo-100 disabled:opacity-50 shadow-sm active:scale-95 transition-all">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} AI Refine Summary
              </button>
              <button onClick={() => window.print()} className="bg-slate-50 text-slate-600 font-bold py-5 px-8 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all"><Printer size={22} /></button>
            </div>
          </section>

          <div className="bg-white rounded-[2.5rem] border border-amber-100 p-8 shadow-sm space-y-6">
            <label className="w-full flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm"><Copy size={16} /></div>
                <div>
                   <span className="text-sm font-bold text-amber-900 block leading-tight">Staff Records Copy</span>
                   <span className="text-[10px] text-amber-700/60 font-medium">BCC: {settings.fromEmail}</span>
                </div>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-amber-600" checked={sendCopyToSelf} onChange={e => setSendCopyToSelf(e.target.checked)} />
            </label>

            <button 
              onClick={() => handleSendEmail(false)} 
              disabled={isSending || (activeRecipients.length === 0 && !sendCopyToSelf)} 
              className="w-full flex items-center justify-center gap-4 bg-amber-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-amber-200 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all transform active:scale-95 text-lg"
            >
              {isSending ? <Loader2 className="animate-spin" /> : <Send size={24} />} 
              <span>{activeRecipients.length === 0 && !sendCopyToSelf ? 'No Active Recipients' : 'Confirm & Send Report'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportPreview;
