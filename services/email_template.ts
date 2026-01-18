
import { DailyLog, Child, Parent, Settings, MealEntry, BottleEntry, NapEntry, DiaperPottyEntry, MedicationEntry } from "../types";

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

export const generateEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string): string => {
  const sections = [];
  sections.push(`REPORT: ${child.firstName} - ${log.date}`);
  sections.push(`Mood: ${log.overallMood} | In: ${format12h(log.arrivalTime)} | Out: ${format12h(log.departureTime)}`);
  sections.push(`\nSUMMARY: ${aiSummary || log.teacherNotes || 'A great day!'}`);
  
  const routines = [];
  if (log.medications && log.medications.length > 0) routines.push(`Meds: ${log.medications.map(m => `${format12h(m.time)} ${m.name}`).join(', ')}`);
  if (log.meals.length > 0) routines.push(`${log.meals.length} Meals: ${log.meals.map(m => `${format12h(m.time)} ${m.type}`).join(', ')}`);
  if (log.bottles.length > 0) routines.push(`${log.bottles.length} Bottles: ${log.bottles.map(b => `${format12h(b.time)} ${b.amount}`).join(', ')}`);
  if (log.naps.length > 0) routines.push(`${log.naps.length} Naps: ${log.naps.map(n => `${format12h(n.startTime)}-${format12h(n.endTime)}`).join(', ')}`);
  if (log.diapers.length > 0) routines.push(`${log.diapers.length} Diapers: ${log.diapers.map(d => `${format12h(d.time)} ${d.type}`).join(', ')}`);
  
  if (log.activities.length > 0) {
    routines.push(`Activities: ${log.activities.map(a => a.category).join(', ')}`);
    if (log.activityNotes) routines.push(`Activity Notes: ${log.activityNotes}`);
  }

  if (routines.length > 0) {
    sections.push(`\nDETAILS:\n${routines.join('\n')}`);
  }

  if (log.suppliesNeeded) {
    sections.push(`\nNEEDS: ${log.suppliesNeeded}`);
  }
  
  sections.push(`\n${settings.emailSignature}`);
  return sections.join('\n');
};

export const generateHtmlEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string): string => {
  const amber400 = '#FBBF24';
  const amber500 = '#F59E0B';
  const amber900 = '#78350F';
  const slate400 = '#94a3b8';
  const slate500 = '#64748b';
  const slate600 = '#475569';
  const slate800 = '#1e293b';

  const renderSection = (title: string, items: string[]) => {
    if (items.length === 0) return '';
    return `
      <div style="background-color: #f8fafc; padding: 10px; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
        <div style="font-size: 9px; font-weight: 800; color: ${slate400}; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">${title}</div>
        <div style="font-size: 11px; color: ${slate600}; line-height: 1.4;">
          ${items.map(item => `<div style="margin-bottom: 2px;">• ${item}</div>`).join('')}
        </div>
      </div>
    `;
  };

  const medDetails = (log.medications || []).map(m => `<b>${format12h(m.time)} Meds:</b> ${m.name} (${m.dosage})`);

  const mealDetails = [
    ...log.meals.map(m => `<b>${format12h(m.time)} ${m.type}:</b> ${m.amount} (${m.items})`),
    ...log.bottles.map(b => `<b>${format12h(b.time)} Bottle:</b> ${b.amount} ${b.type}`)
  ];
  const napDetails = log.naps.map(n => `<b>${format12h(n.startTime)} - ${format12h(n.endTime)}:</b> ${n.quality}`);
  const diaperDetails = log.diapers.map(d => `<b>${format12h(d.time)}:</b> ${d.type}`);
  
  const activityDetails: string[] = log.activities.map(a => a.category);
  if (log.activityNotes) {
    activityDetails.push(`<i>Note: ${log.activityNotes}</i>`);
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fffbeb; padding: 10px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #fde68a; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: ${amber400}; padding: 18px 15px; text-align: center;">
          <h1 style="margin: 0; color: ${amber900}; font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">${child.firstName.toUpperCase()}'S DAILY BUZZ</h1>
          <div style="display: inline-block; margin-top: 4px; background-color: rgba(255,255,255,0.4); padding: 2px 10px; border-radius: 8px; font-size: 10px; font-weight: bold; color: ${amber900};">${log.date}</div>
        </div>

        <div style="padding: 15px;">
          
          <!-- PROMINENT STATS ROW -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
            <tr>
              <td align="left" valign="middle">
                <div style="display: inline-block; background-color: #fffbeb; border: 1px solid ${amber400}; padding: 6px 12px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 9px; font-weight: 800; color: ${amber500}; text-transform: uppercase; margin-bottom: 1px;">Overall Mood</div>
                  <div style="font-size: 16px; font-weight: 900; color: ${amber900};">${log.overallMood}</div>
                </div>
              </td>
              <td align="right" valign="middle">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right: 8px; border-right: 1px solid #e2e8f0;">
                       <div style="font-size: 8px; font-weight: 800; color: ${slate500}; text-transform: uppercase; text-align: right;">Check In</div>
                       <div style="font-size: 13px; font-weight: 900; color: ${slate800}; text-align: right;">${format12h(log.arrivalTime)}</div>
                    </td>
                    <td style="padding-left: 8px;">
                       <div style="font-size: 8px; font-weight: 800; color: ${slate500}; text-transform: uppercase; text-align: left;">Check Out</div>
                       <div style="font-size: 13px; font-weight: 900; color: ${slate800}; text-align: left;">${format12h(log.departureTime)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Narrative Summary -->
          <div style="margin-bottom: 18px; background-color: #f8fafc; padding: 15px; border-radius: 20px; border: 1px solid #f1f5f9; position: relative;">
            <div style="position: absolute; top: -8px; left: 15px; background: ${amber400}; color: ${amber900}; font-size: 8px; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">✨ The Daily Highlight</div>
            <p style="margin: 0; color: ${slate800}; font-size: 13px; line-height: 1.6; font-style: italic; font-weight: 500;">"${aiSummary || log.teacherNotes || 'A wonderful day of learning and growth!'}"</p>
          </div>

          <!-- Medication Alert (If any) -->
          ${medDetails.length > 0 ? `
            <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 10px; border-radius: 14px; margin-bottom: 15px;">
              <div style="font-size: 9px; font-weight: 800; color: #4338ca; text-transform: uppercase; margin-bottom: 4px;">💊 Medication Administered</div>
              <div style="font-size: 11px; color: #3730a3;">
                ${medDetails.join('<br>')}
              </div>
            </div>
          ` : ''}

          <!-- Compact Detailed Grid -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48%" valign="top">
                ${renderSection('🥣 Nutrition', mealDetails)}
                ${renderSection('🛌 Naps & Rest 💤', napDetails)}
              </td>
              <td width="4%"></td>
              <td width="48%" valign="top">
                ${renderSection('🧷 Potty / Diapers', diaperDetails)}
                ${renderSection('🎨 Fun Activities', activityDetails)}
              </td>
            </tr>
          </table>

          ${log.suppliesNeeded ? `
            <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; padding: 10px; border-radius: 14px; margin-top: 10px; text-align: center;">
              <span style="color: #e11d48; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Parent Action Needed</span>
              <p style="margin: 2px 0 0 0; color: #9f1239; font-weight: 700; font-size: 12px;">Bring ${log.suppliesNeeded}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">
            <div style="font-size: 12px; font-weight: 900; color: ${amber900};">${settings.daycareName.toUpperCase()}</div>
            <div style="margin-top: 4px; color: ${slate400}; font-size: 10px; line-height: 1.3;">${settings.emailSignature.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
      </div>
    </div>
  `;
};
