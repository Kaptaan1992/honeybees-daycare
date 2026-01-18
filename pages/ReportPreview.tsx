
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
  EmailSendLog
} from '../types';
import { 
  ArrowLeft, 
  Mail, 
  Sparkles, 
  FileText, 
  CheckCircle2,
  Printer,
  Edit3,
  X,
  Check,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  Copy
} from 'lucide-react';

const ReportPreview: React.FC = () => {
  const { childId, date } = useParams<{ childId: string, date: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [parents, setParents] = useState<Parent[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [settings, setSettings] = useState<Settings>(Store.getSettings());
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSentSuccessfully, setIsSentSuccessfully] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendCopyToSelf, setSendCopyToSelf] = useState(false);
  
  // UI State
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  useEffect(() => {
    const loadData = async () => {
      if (!childId || !date) {
        setError("Missing child or date information.");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const children = await Store.getChildren();
        const foundChild = children.find(c => c.id === childId);
        
        if (!foundChild) {
          setError("Child record not found.");
          setIsLoading(false);
          return;
        }

        const foundLog = await Store.getOrCreateDailyLog(childId, date);
        const allParents = await Store.getParents();
        const appSettings = Store.getSettings();
        
        setChild(foundChild);
        setLog(foundLog);
        setSettings(appSettings);
        setSendCopyToSelf(appSettings.sendCopyToSelfDefault || false);
        setParents(allParents.filter(p => foundChild.parentIds.includes(p.id)));
        setAiSummary(foundLog.teacherNotes || "A wonderful day of learning and play!");
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading the report.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [childId, date]);

  const handleGenerateAISummary = async () => {
    if (!log || !child || parents.length === 0) return;
    setIsGenerating(true);
    try {
      const summary = await generateDailySummary(log, child, parents[0]);
      setAiSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuickEmail = async (id: string) => {
    if (!tempEmail || !tempEmail.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }
    const allParents = await Store.getParents();
    const updatedParents = allParents.map(p => p.id === id ? { ...p, email: tempEmail } : p);
    await Store.saveParents(updatedParents);
    setParents(parents.map(p => p.id === id ? { ...p, email: tempEmail } : p));
    setEditingParentId(null);
  };

  const emailSubject = `Daily Report – ${child?.firstName} – ${date}`;
  const emailContentText = log && child ? generateEmailBody(log, child, settings, aiSummary) : '';
  const emailContentHtml = log && child ? generateHtmlEmailBody(log, child, settings, aiSummary) : '';

  const handleSendEmail = async (isTest = false) => {
    let recipients = isTest 
      ? [settings.testEmail || settings.fromEmail] 
      : parents.filter(p => p.receivesEmail).map(p => p.email);

    // Add daycare's own email if the toggle is on
    if (!isTest && sendCopyToSelf && settings.fromEmail) {
      if (!recipients.includes(settings.fromEmail)) {
        recipients.push(settings.fromEmail);
      }
    }

    if (recipients.length === 0 || !recipients[0]) {
      alert(isTest ? "Please set a Test Email in Settings first!" : "No valid recipients selected.");
      return;
    }

    setIsSending(true);

    if (settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
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

        if (!response.ok) throw new Error('Failed to send via EmailJS');
        
        await logSend(recipients, 'Sent');
        if (!isTest) {
          await completeLog();
          setIsSentSuccessfully(true);
        } else {
          alert('Test email sent successfully via EmailJS!');
        }
      } catch (error) {
        console.error("EmailJS Error:", error);
        alert("Automated send failed. Opening your email app instead...");
        await fallbackToMailto(recipients, isTest);
      } finally {
        setIsSending(false);
      }
    } else {
      await fallbackToMailto(recipients, isTest);
      setIsSending(false);
    }
  };

  const fallbackToMailto = async (recipients: string[], isTest: boolean) => {
    const mailtoUrl = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContentText)}`;
    window.open(mailtoUrl);
    await logSend(recipients, 'Sent');
    if (!isTest) {
      await completeLog();
      setIsSentSuccessfully(true);
    }
  };

  const logSend = async (recipients: string[], status: 'Sent' | 'Failed', errorMessage?: string) => {
    if (!log) return;
    const sendLog: EmailSendLog = {
      id: Math.random().toString(36).substr(2, 9),
      dailyLogId: log.id,
      sentTo: recipients,
      subject: emailSubject,
      sentAt: new Date().toISOString(),
      status,
      errorMessage
    };
    const currentLogs = await Store.getSendLogs();
    await Store.saveSendLogs([...currentLogs, sendLog]);
  };

  const completeLog = async () => {
    if (!log) return;
    const allLogs = await Store.getDailyLogs();
    const updatedLogs = allLogs.map(l => l.id === log.id ? { ...l, status: 'Sent' as const } : l);
    await Store.saveDailyLogs(updatedLogs);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-amber-900/40">
       <Loader2 className="animate-spin mb-4" size={32} />
       <p className="font-bold uppercase tracking-widest text-[10px]">Preparing Preview...</p>
    </div>
  );

  if (error || !child || !log) return (
    <div className="p-12 text-center space-y-4">
      <AlertCircle size={48} className="mx-auto text-amber-600 mb-4" />
      <h2 className="text-2xl font-brand font-extrabold text-slate-800">Report Not Found</h2>
      <p className="text-slate-500 max-w-md mx-auto">{error || "The report you are looking for doesn't exist or was recently deleted."}</p>
      <button 
        onClick={() => navigate('/')}
        className="mt-6 bg-amber-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:bg-amber-700 transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-40 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/log/${childId}`)} className="p-2 -ml-2 text-slate-400 hover:text-amber-600 transition-colors">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-brand font-extrabold text-amber-900">Review Report</h1>
        <div className="w-10"></div>
      </div>

      {isSentSuccessfully ? (
        <div className="bg-white rounded-3xl p-10 text-center shadow-xl border border-amber-100 space-y-4 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-brand font-extrabold text-slate-800">Report Sent!</h2>
          <p className="text-slate-500">The daily report has been successfully sent to the parents.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 bg-amber-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:bg-amber-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          <section className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Parent Recipients</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Mail size={12} />
                <span>{parents.filter(p => p.receivesEmail).length} Active</span>
              </div>
            </div>
            <div className="space-y-3">
              {parents.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">{p.fullName}</p>
                    {editingParentId === p.id ? (
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="email" 
                          autoFocus
                          className="flex-1 text-xs px-2 py-1 rounded bg-white border border-amber-200 outline-none"
                          value={tempEmail}
                          onChange={e => setTempEmail(e.target.value)}
                        />
                        <button onClick={() => saveQuickEmail(p.id)} className="text-green-500"><Check size={16}/></button>
                        <button onClick={() => setEditingParentId(null)} className="text-slate-400"><X size={16}/></button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        {p.email} 
                        <button onClick={() => { setEditingParentId(p.id); setTempEmail(p.email); }} className="p-1 hover:text-amber-500">
                          <Edit3 size={10} />
                        </button>
                      </p>
                    )}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.receivesEmail ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                    <Mail size={16} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Report Preview</h2>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setPreviewMode('html')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${previewMode === 'html' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                >
                  HTML
                </button>
                <button 
                  onClick={() => setPreviewMode('text')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${previewMode === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                >
                  PLAIN
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden min-h-[400px]">
              {previewMode === 'html' ? (
                <div className="w-full h-full p-4 overflow-auto bg-slate-50">
                  <div 
                    className="max-w-[400px] mx-auto bg-white shadow-lg origin-top scale-[0.85] md:scale-100"
                    dangerouslySetInnerHTML={{ __html: emailContentHtml }} 
                  />
                </div>
              ) : (
                <div className="p-6 font-mono text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {emailContentText}
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button 
                onClick={handleGenerateAISummary}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-bold py-4 rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>{isGenerating ? 'Polishing Summary...' : 'AI Refine Summary'}</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-slate-50 text-slate-600 font-bold py-4 px-6 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
              >
                <Printer size={18} />
              </button>
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-white/80 backdrop-blur-md border-t border-amber-100 flex flex-col items-center gap-4">
            {/* Copy to Self Toggle - Per Report */}
            <div className="w-full max-w-2xl px-2">
              <label className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-600">
                    <Copy size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tight text-amber-900 leading-none mb-0.5">Report Records</p>
                    <p className="text-[10px] font-medium text-amber-700/60">Send copy to staff email ({settings.fromEmail})</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-amber-600 rounded-lg"
                  checked={sendCopyToSelf}
                  onChange={e => setSendCopyToSelf(e.target.checked)}
                />
              </label>
            </div>

            <div className="w-full max-w-2xl flex flex-col items-center gap-2">
              {!settings.emailjsPublicKey && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-4 py-1.5 rounded-full mb-1">
                  <AlertCircle size={12} />
                  <span>Using default mail app (no EmailJS keys).</span>
                </div>
              )}
              <button 
                onClick={() => handleSendEmail(false)}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-5 rounded-3xl shadow-2xl shadow-amber-200 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                <span>{isSending ? 'Sending to Recipients...' : 'Confirm & Send Report Now'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportPreview;
