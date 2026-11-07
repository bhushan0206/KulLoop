#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const checks = [];

function ok(label, pass, hint = '') {
  checks.push({ label, pass, hint });
}

const envPath = path.join(root, '.env');
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const has = (key) => new RegExp(`^\\s*${key}=`, 'm').test(envText) || Boolean(process.env[key]);

function envVal(key) {
  const m = envText.match(new RegExp(`^\\s*${key}=(.*)$`, 'm'));
  if (!m) return process.env[key] || '';
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

ok('FIREBASE_PROJECT_ID set', has('FIREBASE_PROJECT_ID') || has('VITE_FIREBASE_PROJECT_ID'), 'Add to .env for ID token verify');
ok(
  'Service account path/JSON configured',
  has('FIREBASE_SERVICE_ACCOUNT_PATH') || has('FIREBASE_SERVICE_ACCOUNT_JSON'),
  'Needed to send FCM (not only verify tokens)'
);

const saPath = envVal('FIREBASE_SERVICE_ACCOUNT_PATH') || './secrets/firebase-service-account.json';
const saAbs = path.resolve(root, saPath);
ok(
  'Service account JSON file exists',
  fs.existsSync(saAbs),
  `Download Admin SDK key for project gen-lang-client-0572007240 → ${saPath}`
);

const gs = path.join(root, 'android/app/google-services.json');
ok('android/app/google-services.json present', fs.existsSync(gs), 'Copy from Firebase Console (see .example)');

ok(
  'REQUIRE_FIREBASE_AUTH for production',
  has('REQUIRE_FIREBASE_AUTH'),
  'Set REQUIRE_FIREBASE_AUTH=true before public launch'
);

ok('SMTP_HOST set', Boolean(envVal('SMTP_HOST')), 'Required for automated email reminders');
ok('SMTP_USER set', Boolean(envVal('SMTP_USER')), 'Required for automated email reminders');
ok('SMTP_PASSWORD set', Boolean(envVal('SMTP_PASSWORD')), 'Required for automated email reminders');
ok('EMAIL_FROM set', Boolean(envVal('EMAIL_FROM')), 'From-address for reminder emails');
ok(
  'Reminder cron enabled (or unset=on)',
  envVal('ENABLE_REMINDER_CRON') !== 'false',
  'ENABLE_REMINDER_CRON=false disables automated email/push'
);
ok(
  'WhatsApp Business API off',
  envVal('ENABLE_WHATSAPP') !== 'true',
  'Keep ENABLE_WHATSAPP unset/false until Meta Cloud API is intentional'
);

console.log('\nKulLoop operator setup check\n');
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '○'} ${c.label}${c.pass || !c.hint ? '' : `\n    → ${c.hint}`}`);
}
const ready = checks.filter((c) => c.pass).length;
console.log(`\n${ready}/${checks.length} checks passed.\n`);
process.exit(0);
