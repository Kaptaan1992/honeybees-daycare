
import { DailyLog, Child, Parent, Settings, Holiday } from "../types";
import { Store } from "../store";

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

const getUpcomingHolidays = (logs: Holiday[], reportDate: string): Holiday[] => {
  const rDate = new Date(reportDate.replace(/-/g, '/'));
  const thirtyDaysLater = new Date(rDate);
  thirtyDaysLater.setDate(rDate.getDate() + 30);

  return logs.filter(h => {
    const hDate = new Date(h.date.replace(/-/g, '/'));
    return hDate >= rDate && hDate <= thirtyDaysLater;
  }).sort((a, b) => a.date.localeCompare(b.date));
};

export const generateEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string, holidays: Holiday[] = []): string => {
  const sections = [];
  sections.push(`REPORT: ${child.firstName} - ${log.date}`);

  const upcoming = getUpcomingHolidays(holidays, log.date);
  if (upcoming.length > 0) {
    sections.push(`\nUPCOMING CLOSURES:`);
    upcoming.forEach(h => sections.push(`${h.date}: ${h.name} (${h.type})`));
  }

  sections.push(`Mood: ${log.overallMood} | In: ${format12h(log.arrivalTime)} | Out: ${format12h(log.departureTime)}`);
  
  if (log.suppliesNeeded) {
    sections.push(`\nSUPPLIES NEEDED: ${log.suppliesNeeded}`);
  }

  sections.push(`\nNOTES FOR PARENTS: ${aiSummary || log.teacherNotes || 'A great day!'}`);
  
  const routines = [];
  if (log.medications && log.medications.length > 0) routines.push(`Meds: ${log.medications.map(m => `${format12h(m.time)} ${m.name}`).join(', ')}`);
  if (log.meals.length > 0) routines.push(`${log.meals.length} Meals: ${log.meals.map(m => `${format12h(m.time)} ${m.type}`).join(', ')}`);
  if (log.bottles.length > 0) routines.push(`${log.bottles.length} Milk: ${log.bottles.map(b => `${format12h(b.time)} ${b.amount}`).join(', ')}`);
  if (log.naps.length > 0) routines.push(`${log.naps.length} Naps: ${log.naps.map(n => `${format12h(n.startTime)}-${format12h(n.endTime)}`).join(', ')}`);
  if (log.diapers.length > 0) routines.push(`${log.diapers.length} Diapers: ${log.diapers.map(d => `${format12h(d.time)} ${d.type}`).join(', ')}`);
  
  if (log.activities.length > 0) {
    routines.push(`Activities: ${log.activities.map(a => a.category).join(', ')}`);
    if (log.activityNotes) routines.push(`Activity Notes: ${log.activityNotes}`);
  }

  if (routines.length > 0) {
    sections.push(`\nDETAILS:\n${routines.join('\n')}`);
  }
  
  sections.push(`\n${settings.emailSignature}`);
  return sections.join('\n');
};

export const generateHtmlEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string, holidays: Holiday[] = [], allLogs: DailyLog[] = []): string => {
  const amber400 = '#FBBF24';
  const amber500 = '#F59E0B';
  const amber900 = '#78350F';
  const slate400 = '#94a3b8';
  const slate500 = '#64748b';
  const slate600 = '#475569';
  const slate800 = '#1e293b';

  const upcoming = getUpcomingHolidays(holidays, log.date);

  // Trend Logic (Last 7 Days)
  let trendHtml = '';
  if (log.includeTrends && allLogs.length > 0) {
    const reportDate = new Date(log.date.replace(/-/g, '/'));
    const startRange = new Date(reportDate);
    startRange.setDate(reportDate.getDate() - 7);
    
    const childLogs = allLogs.filter(l => l.childId === child.id && new Date(l.date.replace(/-/g, '/')) >= startRange && new Date(l.date.replace(/-/g, '/')) <= reportDate);
    
    const totalMilk = childLogs.reduce((sum, cl) => sum + cl.bottles.reduce((s, b) => s + (parseInt(b.amount.replace(/\D/g, '')) || 0), 0), 0);
    const totalNapMin = childLogs.reduce((sum, cl) => sum + cl.naps.reduce((s, n) => {
      if (!n.startTime || !n.endTime) return s;
      const [sh, sm] = n.startTime.split(':').map(Number);
      const [eh, em] = n.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return s + (end > start ? end - start : 0);
    }, 0), 0);
    
    const count = childLogs.length || 1;
    const avgMilk = (totalMilk / count).toFixed(1);
    const avgNap = Math.floor(totalNapMin / count);

    trendHtml = `
      <div class="trend-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 15px; margin-top: 20px;">
        <div class="trend-title" style="font-size: 9px; font-weight: 800; color: ${slate400}; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; text-align: center;">7-Day Growth Highlights</div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="width: 45%;">
            <div class="trend-label" style="font-size: 8px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Daily Milk Avg</div>
            <div class="trend-value" style="font-size: 16px; font-weight: 900; color: #1e40af;">${avgMilk} oz</div>
          </div>
          <div style="width: 10%; text-align: center; color: #e2e8f0;">|</div>
          <div style="width: 45%; text-align: right;">
            <div class="trend-label" style="font-size: 8px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">Daily Nap Avg</div>
            <div class="trend-value" style="font-size: 16px; font-weight: 900; color: #3730a3;">${avgNap} min</div>
          </div>
        </div>
      </div>
    `;
  }

  const renderSection = (title: string, items: string[]) => {
    if (items.length === 0) return '';
    return `
      <div class="section-card" style="background-color: #f8fafc; padding: 10px; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
        <div class="section-title" style="font-size: 9px; font-weight: 800; color: ${slate400}; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${title}</div>
        <div class="section-content" style="font-size: 11px; color: ${slate600}; line-height: 1.4;">
          ${items.map(item => `<div style="margin-bottom: 2px;">• ${item}</div>`).join('')}
        </div>
      </div>
    `;
  };

  const medDetails = (log.medications || []).map(m => `<b>${format12h(m.time)} Meds:</b> ${m.name} (${m.dosage})`);
  const mealDetails = [
    ...log.meals.map(m => `<b>${format12h(m.time)} ${m.type}:</b> ${m.amount} (${m.items})`),
    ...log.bottles.map(b => `<b>${format12h(b.time)} Milk:</b> ${b.amount} ${b.type}`)
  ];
  const napDetails = log.naps.map(n => `<b>${format12h(n.startTime)} - ${format12h(n.endTime)}:</b> ${n.quality}`);
  const diaperDetails = log.diapers.map(d => `<b>${format12h(d.time)}:</b> ${d.type}`);
  const activityDetails: string[] = log.activities.map(a => a.category);
  if (log.activityNotes) activityDetails.push(`<i>Note: ${log.activityNotes}</i>`);

  return `
    <html>
    <head>
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        @media (prefers-color-scheme: dark) {
          .email-body { background-color: #0f172a !important; }
          .main-card { background-color: #1e293b !important; border-color: #334155 !important; }
          .section-card { background-color: #0f172a !important; border-color: #334155 !important; }
          .section-title { color: #94a3b8 !important; }
          .section-content { color: #cbd5e1 !important; }
          .mood-card { background-color: #0f172a !important; border-color: #f59e0b !important; }
          .mood-label { color: #fbbf24 !important; }
          .mood-value { color: #fef3c7 !important; }
          .time-label { color: #94a3b8 !important; }
          .time-value { color: #f1f5f9 !important; }
          .narrative-box { background-color: #0f172a !important; border-color: #334155 !important; }
          .narrative-text { color: #f1f5f9 !important; }
          .footer-name { color: #fbbf24 !important; }
          .footer-sig { color: #94a3b8 !important; }
          .needs-box { background-color: #450a0a !important; border-color: #991b1b !important; }
          .needs-label { color: #fca5a5 !important; }
          .holiday-banner { background-color: #431407 !important; border: 2px dashed #f97316 !important; color: #fdba74 !important; }
          .holiday-header { color: #fb923c !important; }
          .holiday-text { color: #fdba74 !important; }
          .trend-box { background-color: #0f172a !important; border-color: #334155 !important; }
          .trend-title { color: #94a3b8 !important; }
          .trend-label { color: #93c5fd !important; }
          .trend-value { color: #f1f5f9 !important; }
        }
      </style>
    </head>
    <body class="email-body" style="margin: 0; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fffbeb;">
      <div class="main-card" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #fde68a; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
        <div style="background-color: ${amber400}; padding: 18px 15px; text-align: center;">
          <h1 style="margin: 0; color: ${amber900}; font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">${child.firstName.toUpperCase()}'S DAILY BUZZ</h1>
          <div style="display: inline-block; margin-top: 4px; background-color: rgba(255,255,255,0.4); padding: 2px 10px; border-radius: 8px; font-size: 10px; font-weight: bold; color: ${amber900};">${log.date}</div>
        </div>
        <div style="padding: 15px;">
          ${upcoming.length > 0 ? `
            <div class="holiday-banner" style="background-color: #fff7ed; border: 2px dashed #fb923c; border-radius: 16px; padding: 12px; margin-bottom: 15px; text-align: center;">
              <div class="holiday-header" style="font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #c2410c;">Upcoming Closures</div>
              ${upcoming.map(h => `<div class="holiday-text" style="font-size: 11px; font-weight: bold; color: #9a3412;">${h.date}: ${h.name}</div>`).join('')}
            </div>` : ''}
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
            <tr>
              <td><div class="mood-card" style="display: inline-block; background-color: #fffbeb; border: 1px solid ${amber400}; padding: 6px 12px; border-radius: 12px; text-align: center;"><div class="mood-label" style="font-size: 9px; font-weight: 800; color: ${amber500};">Mood</div><div class="mood-value" style="font-size: 16px; font-weight: 900; color: ${amber900};">${log.overallMood}</div></div></td>
              <td align="right"><div class="time-label" style="font-size: 8px; color: ${slate500};">Logged: ${format12h(log.arrivalTime)} - ${format12h(log.departureTime)}</div></td>
            </tr>
          </table>

          ${log.suppliesNeeded ? `<div class="needs-box" style="background-color: #fff1f2; padding: 10px; border-radius: 14px; margin-bottom: 15px; text-align: center; border: 1px solid #fda4af;"><span class="needs-label" style="color: #e11d48; font-size: 9px; font-weight: 900; text-transform: uppercase;">⚠️ Supplies Needed: ${log.suppliesNeeded}</span></div>` : ''}
          
          <div class="narrative-box" style="margin-bottom: 18px; background-color: #f8fafc; padding: 15px; border-radius: 20px; border: 1px solid #f1f5f9;"><p class="narrative-text" style="margin: 0; color: ${slate800}; font-size: 13px; line-height: 1.6;">"${aiSummary || log.teacherNotes || 'A wonderful day!'}"</p></div>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48%" valign="top">${renderSection('🥣 Nutrition', mealDetails)}${renderSection('🛌 Naps', napDetails)}</td>
              <td width="4%"></td>
              <td width="48%" valign="top">${renderSection('🧷 Diapers', diaperDetails)}${renderSection('🎨 Activities', activityDetails)}</td>
            </tr>
          </table>

          ${trendHtml}

          <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;"><div class="footer-name" style="font-size: 12px; font-weight: 900; color: ${amber900};">${settings.daycareName}</div><div class="footer-sig" style="font-size: 10px; color: ${slate500}; margin-top: 4px;">Honeybees Daycare Portal</div></div>
        </div>
      </div>
    </body>
    </html>
  `;
};
