import { getAllBundlesForCron, mutateBundle, isFirestoreCanonical } from './kulloopStore.js';
import { sendEmail } from './mailer.js';
import { sendFcmToToken } from './pushMessaging.js';
import { FamilyOccasion, Member, RitualReminderCategory } from '../src/types';
import type { DatabaseSchema } from './storage.js';

/** WhatsApp Cloud / Business API is intentionally off — click-to-chat only in the product UI. */
const ENABLE_WHATSAPP_BUSINESS_API = process.env.ENABLE_WHATSAPP === 'true';
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

function memberEmail(member: Member): string | undefined {
  const preferred = member.reminderPreferences?.emailAddress?.trim();
  if (preferred) return preferred;
  return member.email?.trim() || undefined;
}

function isRealPushToken(token: string): boolean {
  return Boolean(token) && !token.startsWith('web_');
}

function buildReminderHtml(opts: {
  familyName: string;
  title: string;
  dateStr: string;
  tithi: string;
  leadLabel: string;
}): string {
  const { familyName, title, dateStr, tithi, leadLabel } = opts;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #fafaf9; color: #1c1917;">
      <div style="background-color: #1c1917; color: #fef3c7; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">KulLoop · Family Tithi Reminders</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #d6d3d1;">Sacred observances for ${familyName}</p>
      </div>
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #b45309; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">Coming ${leadLabel}</p>
        <h3 style="margin-top: 0; color: #1c1917; font-size: 18px;">${title}</h3>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${dateStr}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Tithi / Paksha:</strong> ${tithi}</p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #57534e; line-height: 1.5;">
          Automated email from your family’s KulLoop ledger. WhatsApp Business broadcasts are not used — share a message yourself from the Reminders hub when you want to reach elders on WhatsApp.
        </p>
      </div>
      <p style="font-size: 11px; color: #78716c; text-align: center; margin: 0;">KulLoop — Independent Family Ritual Service</p>
    </div>
  `;
}

async function processFamilyBundle(data: DatabaseSchema, logs: string[]): Promise<void> {
  const now = new Date();
  const members = data.members.filter((m) => m.status === 'active');
  const pushDevices = data.pushDevices || [];
  const dispatchLog = [...(data.reminderDispatchLog || [])];
  const initialLen = dispatchLog.length;

  for (const member of members) {
    const windows = leadWindowsForMember(member);
    const pushEnabled = member.reminderPreferences?.pushEnabled !== false;
    const memberDevices = pushDevices.filter(
      (d) =>
        isRealPushToken(d.token) &&
        ((member.authUid && d.uid === member.authUid) ||
          (d.memberId && d.memberId === member.id) ||
          (member.email && d.uid === member.email))
    );

    for (const occ of data.occasions) {
      const days = daysUntil(occ, now);
      if (days === null || days < 0) continue;
      if (!windows.includes(days)) continue;

      const prefs = member.reminderPreferences?.categories[occ.occasionType as RitualReminderCategory];
      if (!prefs) continue;

      const key = dispatchKey(member.id, occ.id, days);
      if (wasAlreadySent(dispatchLog, key)) {
        logs.push(`Skip duplicate ${data.family.id}/${key}`);
        continue;
      }

      const dateStr = occ.occurrence2027.gregorianDateStr;
      const tithi = occ.occurrence2027.tithiSpan || 'tithi';
      const leadLabel =
        days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
      const subject = `KulLoop · ${occ.title} ${leadLabel}`;
      const shortBody = `${occ.title} · ${dateStr} · ${tithi}. ${data.family.name}.`;

      let attempted = false;
      let succeeded = false;

      const toEmail = prefs.email ? memberEmail(member) : undefined;
      if (prefs.email && toEmail) {
        attempted = true;
        const html = buildReminderHtml({
          familyName: data.family.name,
          title: occ.title,
          dateStr,
          tithi,
          leadLabel,
        });
        const ok = await sendEmail(toEmail, subject, html);
        logs.push(
          ok
            ? `Email → ${toEmail} (${leadLabel}) ${occ.title}`
            : `Email FAILED → ${toEmail} (${leadLabel}) ${occ.title}`
        );
        if (ok) succeeded = true;
      } else if (prefs.email && !toEmail) {
        logs.push(`Email pref on for ${member.name} but no email address`);
      }

      if (prefs.push && pushEnabled && memberDevices.length > 0) {
        for (const device of memberDevices) {
          attempted = true;
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
            `Push → ${member.name} (${device.platform}) ${leadLabel} sent=${result.sent}${result.simulated ? ' (sim)' : ''}${result.error ? ` err=${result.error}` : ''}`
          );
          if (result.sent && !result.simulated) succeeded = true;
        }
      } else if (prefs.push && pushEnabled) {
        logs.push(`Push pref on for ${member.name} but no FCM device token`);
      }

      if (ENABLE_WHATSAPP_BUSINESS_API && prefs.whatsapp && member.phone) {
        logs.push(`[WhatsApp Business API stub] ${member.phone} ${occ.title} ${leadLabel}`);
      }

      if (!attempted) {
        logs.push(
          `No automated channel for ${data.family.id}/${key} (email/push off or missing; WhatsApp is share-yourself only)`
        );
        continue;
      }

      if (succeeded) {
        dispatchLog.push(key);
      } else {
        logs.push(`Delivery failed for ${data.family.id}/${key} — will retry next cron`);
      }
    }
  }

  if (dispatchLog.length !== initialLen) {
    await mutateBundle(
      undefined,
      (draft) => {
        draft.reminderDispatchLog = dispatchLog.slice(-5000);
      },
      'REMINDER_DISPATCH',
      'SYSTEM',
      'worker',
      data.family.id
    );
  }
}

export async function runReminderWorker(): Promise<string[]> {
  const logs: string[] = [];
  logs.push(
    `Running reminder worker (email + FCM; store=${isFirestoreCanonical() ? 'firestore' : 'memory'}; WhatsApp auto-send off)…`
  );

  const bundles = await getAllBundlesForCron();
  if (bundles.length === 0) {
    logs.push('No families in store — nothing to remind.');
    return logs;
  }

  for (const data of bundles) {
    logs.push(`Family ${data.family.name} (${data.family.id}) members=${data.members.length} occasions=${data.occasions.length}`);
    await processFamilyBundle(data, logs);
  }

  logs.push(`Done. Families=${bundles.length}`);
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
  console.log(`[reminder cron] every ${Math.round(REMINDER_CRON_MS / 60000)} min (email + FCM)`);
  setTimeout(tick, 15_000);
}
