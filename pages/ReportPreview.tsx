
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
  Holiday
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
  LineChart
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

  const handleSendEmail = async (isTest = false) => {
    let recipients = isTest ? [settings.testEmail || settings.fromEmail] : parents.filter(p => p.receivesEmail).map(p => p.email);
    if (!isTest && sendCopyToSelf && settings.fromEmail) recipients.push(settings.fromEmail);
    recipients = Array.from(new Set(recipients)).filter(Boolean);

    if (recipients.length === 0) {
      alert("No recipients!");
      return;
    }

    setIsSending(true);
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
          if (!isTest) {
            await Store.saveDailyLog({ ...log!, status: 'Sent' });
            setIsSentSuccessfully(true);
          }
        }
      } catch (e) { console.error(e); }
    } else {
      const mailto = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContentText)}`;
      window.open(mailto);
      if (!isTest) setIsSentSuccessfully(true);
    }
    setIsSending(false);
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (error) return <div className="p-20 text-center">{error}</div>;

  return (
    <div className="space-y-6 pb-40">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/log/${childId}`)} className="p-2 text-slate-400 hover:text-amber-600"><ArrowLeft /></button>
        <h1 className="text-2xl font-brand font-extrabold text-amber-900">Review Report</h1>
        <div className="w-10" />
      </div>

      {isSentSuccessfully ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-amber-100 space-y-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={40} /></div>
          <h2 className="text-2xl font-brand font-extrabold text-slate-800">Report Sent!</h2>
          <button onClick={() => navigate('/')} className="mt-6 bg-amber-600 text-white font-bold px-8 py-3 rounded-2xl">Back to Dashboard</button>
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase">7-day milk & nap averages</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-purple-600 rounded-lg"
                  checked={log?.includeTrends || false} 
                  onChange={toggleTrends} 
                />
              </label>

              {parents.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{p.fullName}</p>
                    <p className="text-xs text-slate-400">{p.email}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.receivesEmail ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}><Mail size={16} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden min-h-[400px] p-4 bg-slate-50">
               <div className="max-w-[400px] mx-auto bg-white shadow-lg" dangerouslySetInnerHTML={{ __html: emailContentHtml }} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleGenerateAISummary} disabled={isGenerating} className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-bold py-4 rounded-2xl border border-indigo-100 disabled:opacity-50">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} AI Refine Summary
              </button>
              <button onClick={() => window.print()} className="bg-slate-50 text-slate-600 font-bold py-4 px-6 rounded-2xl border border-slate-100"><Printer size={18} /></button>
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-white/80 backdrop-blur-md border-t border-amber-100 flex flex-col items-center gap-4">
            <label className="w-full max-w-2xl flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <Copy size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-900">BCC Staff Record ({settings.fromEmail})</span>
              </div>
              <input type="checkbox" checked={sendCopyToSelf} onChange={e => setSendCopyToSelf(e.target.checked)} />
            </label>
            <button onClick={() => handleSendEmail(false)} disabled={isSending} className="w-full max-w-2xl flex items-center justify-center gap-3 bg-amber-600 text-white font-extrabold py-5 rounded-3xl shadow-xl shadow-amber-200 disabled:opacity-50">
              {isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />} Confirm & Send Report Now
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportPreview;
