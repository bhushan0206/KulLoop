import { FamilyOccasion, Family } from '../types';

/**
 * Estimates Hindu lunar month & tithi from a Gregorian date.
 * Flagged as unconfirmed until checked with a priest or printed panchang.
 */
export function estimateTithiFromDate(dateStr: string, convention: 'Amanta' | 'Purnimanta' = 'Amanta') {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  // Approximate solar-lunar epoch offsets for deterministic estimate
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  // Known anchor: Chaitra Pratipada approx near late March / early April
  // Approximate lunar month mapping
  const monthNames = [
    'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
    'Ashwin', 'Kartik', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
  ];
  const tithiNames = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
    'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
    'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya'
  ];

  // Lunation calculation approx: ~29.53 days per synodic month
  const epoch = new Date(2000, 0, 6, 18, 14).getTime(); // Known New Moon
  const diffDays = (d.getTime() - epoch) / (1000 * 60 * 60 * 24);
  const lunarCycle = 29.53058867;
  const phaseDays = ((diffDays % lunarCycle) + lunarCycle) % lunarCycle;

  // Day 0 to 14.76 is Shukla Paksha; 14.76 to 29.53 is Krishna Paksha
  const isShukla = phaseDays < (lunarCycle / 2);
  const paksha: 'Shukla' | 'Krishna' = isShukla ? 'Shukla' : 'Krishna';
  
  const dayInPaksha = isShukla ? phaseDays : (phaseDays - (lunarCycle / 2));
  const tithiIdx = Math.min(14, Math.max(0, Math.floor((dayInPaksha / (lunarCycle / 2)) * 15)));
  const tithi = tithiNames[tithiIdx];

  // Approximate month index based on season and solar calendar
  let estimatedMonthIdx = (month + 8) % 12; // Approximation
  if (convention === 'Purnimanta' && !isShukla) {
    // In purnimanta, krishna paksha starts the new month
    estimatedMonthIdx = (estimatedMonthIdx + 1) % 12;
  }
  const lunarMonth = monthNames[estimatedMonthIdx];

  return {
    lunarMonth,
    paksha,
    tithi,
    isConfirmed: false,
    needsVerification: true,
    verificationNote: `Estimated from Gregorian date (${day}-${month}-${year}). Marked unconfirmed until confirmed with family priest or printed almanac.`,
  };
}

/**
 * Generate a Priest-Ready Note (गुरुजींसाठी पत्र / संकल्प नोंद)
 * Formatted cleanly so it can be copied into WhatsApp or printed.
 */
export function generatePriestReadyNote(occasion: FamilyOccasion, family: Family) {
  const tithi = occasion.tithiFields;
  const gregorian = occasion.occurrence2027;

  return `॥ ॐ श्री गणेशाय नमः ॥
॥ कुललूप — गुरुजींसाठी संकल्प व श्राद्ध/विधी नोंद ॥

१. कुटुंब प्रमुख / यजमान: ${family.configuratorName} (${family.name})
२. कुलदैवत / संप्रदाय: ${family.traditionNotes || 'पारंपरिक'}
३. स्थान / सूर्योदय: ${family.homeLocation} (${family.convention} पद्धती)
४. व्यक्ती / पितर: ${occasion.personNameDisplay || occasion.title}
५. नातेसंबंध: ${occasion.relationshipDisplay || 'कुटुंब सदस्य'}
${occasion.personIds.length > 0 ? `६. गोत्र: काश्यप (किंवा कुटुंबाचे गोत्र)` : ''}
७. विहित तिथी: ${tithi ? `${tithi.lunarMonthDevanagari || tithi.lunarMonth} ${tithi.pakshaDevanagari || tithi.paksha} ${tithi.tithiDevanagari || tithi.tithi}` : 'पारंपरिक विधी'}
८. चालू वर्षाची इंग्रजी तारीख: ${gregorian.formattedDisplay} (${gregorian.weekday})
९. वेळेचा तपशील: ${gregorian.tithiSpan}
१०. सूर्योदय वेळ: ${gregorian.sunriseTime}
११. पंचांग संदर्भ: ${family.validationSource}

* नोंद: ही तारीख कुटुंबाच्या सूर्योदयानुरूप आणि पंचांग नियमांनुसार निश्चित केली आहे.`;
}

/**
 * Export family record to CSV for user peace of mind (never held hostage)
 */
export function exportFamilyRecordToCSV(occasions: FamilyOccasion[], family: Family): string {
  const headers = [
    'Occasion Title',
    'Type',
    'Person / Ancestor',
    'Lunar Month',
    'Paksha',
    'Tithi',
    'Gregorian Date (2027)',
    'Weekday',
    'Sunrise & Tithi Span',
    'Confirmed Status',
    'Validation Source',
    'Practice Notes'
  ];

  const rows = occasions.map((occ) => [
    `"${occ.title.replace(/"/g, '""')}"`,
    `"${occ.occasionType}"`,
    `"${(occ.personNameDisplay || '').replace(/"/g, '""')}"`,
    `"${occ.tithiFields?.lunarMonth || 'N/A'}"`,
    `"${occ.tithiFields?.paksha || 'N/A'}"`,
    `"${occ.tithiFields?.tithi || 'N/A'}"`,
    `"${occ.occurrence2027.formattedDisplay}"`,
    `"${occ.occurrence2027.weekday}"`,
    `"${occ.occurrence2027.tithiSpan}"`,
    `"${occ.isConfirmed ? 'Confirmed' : 'Unconfirmed'}"`,
    `"${(occ.occurrence2027.validationSourceUsed || family.validationSource).replace(/"/g, '""')}"`,
    `"${(occ.practiceNotes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Format a Date to RFC 5545 timestamp: YYYYMMDDTHHMMSSZ
 */
function toICSTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format a YYYY-MM-DD string to next day in YYYYMMDD format for all-day DTEND
 */
function getNextDayICS(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Export family occasions to standard iCalendar (.ics) format
 * Compatible with Google Calendar, Apple Calendar, and Outlook.
 */
export function exportFamilyRecordToICS(occasions: FamilyOccasion[], family: Family): string {
  const nowStamp = toICSTimestamp(new Date());
  const calName = `${family.name} — Tithi & Ritual Calendar`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KulLoop//Family Tithi Loop//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName.replace(/[,;]/g, ' ')}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    'X-WR-CALDESC:Family ritual and tithi calendar computed for home sunrise location with zero fear-based astrology.'
  ];

  occasions.forEach((occ) => {
    const rawDate = occ.occurrence2027.gregorianDateStr; // e.g. "2026-10-31"
    const startDateFormatted = rawDate.replace(/-/g, ''); // "20261031"
    const endDateFormatted = getNextDayICS(rawDate); // "20261101"

    const tithiText = occ.tithiFields
      ? `${occ.tithiFields.lunarMonth} ${occ.tithiFields.paksha} ${occ.tithiFields.tithi}`
      : 'Calendar Date Recurrence';

    let desc = `Occasion: ${occ.title}\\n`;
    desc += `Tithi: ${tithiText}\\n`;
    desc += `Timing: ${occ.occurrence2027.tithiSpan}\\n`;
    desc += `Sunrise: ${occ.occurrence2027.sunriseTime}\\n`;
    desc += `Home Place: ${family.homeLocation} (${family.convention} convention)\\n`;
    if (occ.practiceNotes) {
      desc += `Family Practice: ${occ.practiceNotes.replace(/[,;]/g, ' ')}\\n`;
    }
    desc += `Source: Validated against ${occ.occurrence2027.validationSourceUsed}\\n`;
    desc += `Delivered by KulLoop (Family Tithi Loop)`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:kulloop-${occ.id}@kulloop.app`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startDateFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${endDateFormatted}`);
    lines.push(`SUMMARY:${occ.title.replace(/[,;]/g, ' ')}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push(`LOCATION:${family.homeLocation.replace(/[,;]/g, ' ')}`);
    lines.push('STATUS:CONFIRMED');
    lines.push(`CATEGORIES:${occ.occasionType.toUpperCase()},TITHI,KULLOOP`);
    
    // 7 days before alarm
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P7D');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Upcoming in 7 days: ${occ.title.replace(/[,;]/g, ' ')}`);
    lines.push('END:VALARM');

    // 2 days before alarm
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P2D');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Upcoming in 2 days: ${occ.title.replace(/[,;]/g, ' ')}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download for .ics or other calendar formats
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/calendar;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

