
import { DailyLog, Child, Parent, Settings } from "../types";

export const generateEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string): string => {
  const sections = [];
  sections.push(`DAILY REPORT: ${child.firstName} ${child.lastName}`);
  sections.push(`Date: ${log.date}`);
  sections.push(`Arrived: ${log.arrivalTime} | Departed: ${log.departureTime}`);
  sections.push(`Overall Mood: ${log.overallMood}`);
  sections.push(`\n------------------------------------------\n`);
  sections.push(`SPECIAL MOMENTS:`);
  sections.push(aiSummary || log.teacherNotes || "A wonderful day of learning and play!");
  sections.push(`\n------------------------------------------\n`);
  if (log.activities.length > 0) {
    sections.push(`ACTIVITIES & LEARNING:`);
    log.activities.forEach(a => sections.push(`- [${a.time}] ${a.category}: ${a.description}`));
    sections.push(``);
  }
  if (log.meals.length > 0 || log.bottles.length > 0) {
    sections.push(`NUTRITION:`);
    log.meals.forEach(m => sections.push(`- [${m.time}] ${m.type}: ${m.items} (${m.amount} eaten)`));
    log.bottles.forEach(b => sections.push(`- [${b.time}] Bottle: ${b.type} (${b.amount})`));
    sections.push(``);
  }
  if (log.naps.length > 0) {
    sections.push(`REST:`);
    log.naps.forEach(n => sections.push(`- [${n.startTime}] Nap started (${n.quality} quality)`));
    sections.push(``);
  }
  if (log.suppliesNeeded) {
    sections.push(`SUPPLIES NEEDED:`);
    sections.push(`* ${log.suppliesNeeded}`);
    sections.push(``);
  }
  sections.push(`\n${settings.emailSignature}`);
  return sections.join('\n');
};

export const generateHtmlEmailBody = (log: DailyLog, child: Child, settings: Settings, aiSummary?: string): string => {
  const amber400 = '#FBBF24';
  const amber900 = '#78350F';
  const slate500 = '#64748b';
  const slate800 = '#1e293b';

  const renderItems = (items: any[], title: string) => {
    if (items.length === 0) return '';
    return `
      <div style="margin-bottom: 24px;">
        <h3 style="color: ${slate500}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #fef3c7; padding-bottom: 8px; margin-bottom: 12px;">${title}</h3>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${items.map(item => `
            <tr>
              <td style="padding: 4px 0; font-size: 14px; vertical-align: top; width: 60px; color: ${amber400}; font-weight: bold;">${item.time || item.startTime || ''}</td>
              <td style="padding: 4px 0; font-size: 14px; color: ${slate800};">
                <strong>${item.category || item.type || (item.startTime ? 'Nap' : '')}</strong>
                <div style="color: ${slate500}; font-size: 12px; font-style: italic;">${item.description || item.items || item.quality || ''} ${item.amount ? `(${item.amount})` : ''}</div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  };

  return `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #fffbeb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #fde68a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background-color: ${amber400}; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: ${amber900}; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">${settings.daycareName}</h1>
          <p style="margin: 8px 0 0 0; color: ${amber900}; font-weight: bold; opacity: 0.8;">Daily Report for ${child.firstName}</p>
          <div style="display: inline-block; margin-top: 12px; background-color: rgba(255,255,255,0.3); padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; color: ${amber900};">${log.date}</div>
        </div>

        <div style="padding: 32px;">
          <!-- Stats Grid -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
              <td align="center" style="background-color: #f8fafc; padding: 12px; border-radius: 16px; width: 33%;">
                <div style="font-size: 10px; font-weight: bold; color: ${slate500}; text-transform: uppercase;">Arrived</div>
                <div style="font-size: 16px; font-weight: bold; color: ${slate800};">${log.arrivalTime}</div>
              </td>
              <td width="10"></td>
              <td align="center" style="background-color: #f8fafc; padding: 12px; border-radius: 16px; width: 33%;">
                <div style="font-size: 10px; font-weight: bold; color: ${slate500}; text-transform: uppercase;">Mood</div>
                <div style="font-size: 16px; font-weight: bold; color: ${slate800};">${log.overallMood}</div>
              </td>
              <td width="10"></td>
              <td align="center" style="background-color: #f8fafc; padding: 12px; border-radius: 16px; width: 33%;">
                <div style="font-size: 10px; font-weight: bold; color: ${slate500}; text-transform: uppercase;">Departed</div>
                <div style="font-size: 16px; font-weight: bold; color: ${slate800};">${log.departureTime}</div>
              </td>
            </tr>
          </table>

          <!-- Narrative -->
          <div style="background-color: #fffdf2; border: 1px solid #fef3c7; padding: 24px; border-radius: 24px; margin-bottom: 32px;">
            <h3 style="margin: 0 0 12px 0; color: ${slate800}; font-size: 16px; font-weight: bold;">Special Moments</h3>
            <p style="margin: 0; color: ${slate500}; line-height: 1.6; font-style: italic;">"${aiSummary || log.teacherNotes || 'A wonderful day of learning!'}"</p>
          </div>

          <!-- Sections -->
          ${renderItems(log.activities, 'Activities & Learning')}
          ${renderItems([...log.meals, ...log.bottles], 'Nutrition')}
          ${renderItems(log.naps, 'Rest')}
          
          ${log.diapers.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <h3 style="color: ${slate500}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #fef3c7; padding-bottom: 8px; margin-bottom: 12px;">Potty</h3>
              <div style="color: ${slate800}; font-size: 14px; font-weight: bold;">
                ${log.diapers.map(d => `<span style="display: inline-block; padding: 4px 8px; background-color: #f8fafc; border-radius: 6px; margin: 2px; border: 1px solid #f1f5f9;">${d.time} - ${d.type}</span>`).join(' ')}
              </div>
            </div>
          ` : ''}

          ${log.suppliesNeeded ? `
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 16px; margin-bottom: 32px;">
              <span style="color: #ef4444; font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 4px;">Needs</span>
              <p style="margin: 0; color: #b91c1c; font-weight: bold; font-size: 14px;">${log.suppliesNeeded}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #fef3c7; padding-top: 32px; margin-top: 32px;">
            <p style="margin: 0; color: ${slate500}; font-size: 14px;">${settings.emailSignature.replace(/\n/g, '<br>')}</p>
            <p style="margin: 8px 0 0 0; color: ${slate500}; font-size: 11px; font-style: italic;">Reply to this email if you have any questions.</p>
          </div>
        </div>
      </div>
    </div>
  `;
};
