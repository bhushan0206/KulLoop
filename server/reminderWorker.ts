import { dbStore } from './storage';
import { sendEmail } from './mailer';
import { sendFcmToToken } from './pushMessaging';
import { FamilyOccasion, Member, RitualReminderCategory } from '../src/types';

const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';
const REMINDER_CRON_MS = parseInt(process.env.REMINDER_CRON_MS || String(6 * 60 * 60 * 1000), 10);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysUntil(occasion: FamilyOccasion, from: Date): number | null {
  const raw = occasion.occurrence2027?.gregorianDateStr;
  if (!raw) return null;
  const target = startOfDay(new Date(raw));
  if (Number.isNaN(target.getTime())) return null;
  const today = startOfDay(from);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function leadWindowsForMember(member: Member): number[] {
  switch (member.leadTime) {
    case '7+2':
      return [7, 2, 0];
    case '7':
      return [7, 0];
    case '2':
      return [2, 0];
    case 'day_of':
      return [0];
    default:
      return [7, 2, 0];
  }
}

function dispatchKey(memberId: string, occasionId: string, windowDays: number): string {
  return `${memberId}:${occasionId}:d${windowDays}`;
}

function wasAlreadySent(keys: string[], key: string): boolean {
  return keys.includes(key);
}

export async function runReminderWorker(): Promise<string[]> {
  const logs: string[] = [];
  logs.push('Running reminder worker…');

  const now = new Date();
  const data = dbStore.getData();
  const allOccasions = data.occasions;
  const members = data.members.filter((m) => m.status === 'active');
  const pushDevices = data.pushDevices || [];

  const dispatchLog = [...(data.reminderDispatchLog || [])];

  for (const member of members) {
    const windows = leadWindowsForMember(member);
    const memberDevices = pushDevices.filter(
      (d) =>
        (member.authUid && d.uid === member.authUid) ||
        (d.memberId && d.memberId === member.id) ||
        (member.email && d.uid === member.email)
    );

    for (const occ of allOccasions) {
      const days = daysUntil(occ, now);
      if (days === null || days < 0) continue;
      if (!windows.includes(days)) continue;

      const prefs = member.reminderPreferences?.categories[occ.occasionType as RitualReminderCategory];
      if (!prefs) continue;

      const key = dispatchKey(member.id, occ.id, days);
      if (wasAlreadySent(dispatchLog, key)) {
        logs.push(`Skip duplicate ${key}`);
        continue;
      }

      const dateStr = occ.occurrence2027.gregorianDateStr;
      const tithi = occ.occurrence2027.tithiSpan || 'tithi';
      const leadLabel =
        days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
      const subject = `KulLoop · ${occ.title} ${leadLabel}`;
      const shortBody = `${occ.title} · ${dateStr} · ${tithi}. ${data.family.name}.`;

      if (prefs.email && member.email) {
        logs.push(`Email → ${member.email} (${leadLabel}) ${occ.title}`);
        await sendEmail(member.email, subject, shortBody);
      }

      if (prefs.push && memberDevices.length > 0) {
        for (const device of memberDevices) {
          const result = await sendFcmToToken(device.token, {
            title: subject,
            body: shortBody,
            data: {
              occasionId: occ.id,
              leadDays: String(days),
              source: 'kulloop-reminder-worker',
            },
          });
          logs.push(
            `Push → ${member.name} (${device.platform}) ${leadLabel} sent=${result.sent}${result.simulated ? ' (sim)' : ''}`
          );
        }
      } else if (prefs.push) {
        logs.push(`Push pref on for ${member.name} but no device token`);
      }

      if (ENABLE_WHATSAPP && prefs.whatsapp && member.phone) {
        logs.push(`[WhatsApp queue] ${member.phone} ${occ.title} ${leadLabel}`);
      }

      dispatchLog.push(key);
    }
  }

  if (dispatchLog.length !== (data.reminderDispatchLog || []).length) {
    dbStore.save((draft) => {
      draft.reminderDispatchLog = dispatchLog.slice(-5000);
    }, 'REMINDER_DISPATCH', 'SYSTEM', 'worker');
  }

  logs.push(`Done. Members=${members.length}, occasions=${allOccasions.length}`);
  return logs;
}

let cronTimer: ReturnType<typeof setInterval> | null = null;

export function startReminderCron(): void {
  if (process.env.ENABLE_REMINDER_CRON === 'false') return;
  if (cronTimer) return;

  const tick = () => {
    runReminderWorker().catch((err) => console.error('[reminder cron]', err));
  };

  cronTimer = setInterval(tick, REMINDER_CRON_MS);
  console.log(`[reminder cron] every ${Math.round(REMINDER_CRON_MS / 60000)} min`);
  setTimeout(tick, 15_000);
}
