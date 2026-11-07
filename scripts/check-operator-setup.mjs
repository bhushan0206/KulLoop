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

ok('FIREBASE_PROJECT_ID set', has('FIREBASE_PROJECT_ID') || has('VITE_FIREBASE_PROJECT_ID'), 'Add to .env for ID token verify');
ok(
  'Service account configured',
  has('FIREBASE_SERVICE_ACCOUNT_PATH') || has('FIREBASE_SERVICE_ACCOUNT_JSON'),
  'Needed to send FCM (not only verify tokens)'
);

const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './secrets/firebase-service-account.json';
ok(
  'Service account file exists (if path used)',
  !has('FIREBASE_SERVICE_ACCOUNT_PATH') || fs.existsSync(path.resolve(root, saPath.replace(/^\.\//, ''))),
  `Missing ${saPath}`
);

const gs = path.join(root, 'android/app/google-services.json');
ok('android/app/google-services.json present', fs.existsSync(gs), 'Copy from Firebase Console (see .example)');

ok(
  'REQUIRE_FIREBASE_AUTH for production',
  has('REQUIRE_FIREBASE_AUTH'),
  'Set REQUIRE_FIREBASE_AUTH=true before public launch'
);

console.log('\nKulLoop operator setup check\n');
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '○'} ${c.label}${c.pass || !c.hint ? '' : `\n    → ${c.hint}`}`);
}
const ready = checks.filter((c) => c.pass).length;
console.log(`\n${ready}/${checks.length} checks passed.\n`);
process.exit(0);
