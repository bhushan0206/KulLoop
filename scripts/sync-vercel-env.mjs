#!/usr/bin/env node
/**
 * Push local .env + Firebase service account into Vercel (Production / Preview / Development)
 * via the Vercel REST API (more reliable than `vercel env add` for Preview-all-branches).
 *
 * Usage: npm run sync:vercel-env
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const root = process.cwd();
const envPath = path.join(root, '.env');
const saPath = path.join(root, 'secrets/firebase-service-account.json');
const vercelProjectPath = path.join(root, '.vercel/project.json');

function parseEnvFile(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function readVercelToken() {
  const authPath = path.join(os.homedir(), 'Library/Application Support/com.vercel.cli/auth.json');
  if (!fs.existsSync(authPath)) {
    throw new Error('Not logged in to Vercel CLI. Run: vercel login');
  }
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const token = auth.token || auth.accessToken;
  if (!token) throw new Error('Vercel auth.json has no token');
  return token;
}

async function api(token, pathname, opts = {}) {
  const res = await fetch(`https://api.vercel.com${pathname}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(
      `${res.status} ${pathname}: ${typeof body === 'string' ? body : JSON.stringify(body)}`
    );
  }
  return body;
}

const KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_FROM_NAME',
  'GEMINI_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIRESTORE_DATABASE_ID',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
  'GOOGLE_CLIENT_ID',
  'APP_URL',
  'ENABLE_REMINDER_CRON',
  'REMINDER_CRON_MS',
  'ENABLE_WHATSAPP',
  'REQUIRE_FIREBASE_AUTH',
  'CRON_SECRET',
];

if (!fs.existsSync(envPath)) {
  console.error('Missing .env');
  process.exit(1);
}

const token = readVercelToken();
const local = parseEnvFile(fs.readFileSync(envPath, 'utf8'));

if (!local.CRON_SECRET) {
  local.CRON_SECRET = `kulloop_${crypto.randomBytes(16).toString('hex')}`;
  fs.appendFileSync(envPath, `\nCRON_SECRET=${local.CRON_SECRET}\n`);
  console.log('Generated CRON_SECRET → local .env');
}
if (!local.FIREBASE_PROJECT_ID) local.FIREBASE_PROJECT_ID = local.VITE_FIREBASE_PROJECT_ID;
if (!local.FIRESTORE_DATABASE_ID && local.VITE_FIREBASE_DATABASE_ID) {
  local.FIRESTORE_DATABASE_ID = local.VITE_FIREBASE_DATABASE_ID;
}
if (!local.APP_URL || local.APP_URL.includes('localhost')) {
  local.APP_URL = 'https://kulloop.vercel.app';
}
if (local.ENABLE_WHATSAPP === undefined) local.ENABLE_WHATSAPP = 'false';
if (local.ENABLE_REMINDER_CRON === undefined) local.ENABLE_REMINDER_CRON = 'true';

if (fs.existsSync(saPath)) {
  local.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(JSON.parse(fs.readFileSync(saPath, 'utf8')));
} else {
  console.error('Missing secrets/firebase-service-account.json');
  process.exit(1);
}

let projectId = fs.existsSync(vercelProjectPath)
  ? JSON.parse(fs.readFileSync(vercelProjectPath, 'utf8')).projectId
  : null;

const projects = await api(token, '/v9/projects?limit=50');
if (!projectId) {
  const hit = (projects.projects || []).find((p) => p.name === 'kulloop');
  if (!hit) throw new Error('Vercel project "kulloop" not found — run vercel link');
  projectId = hit.id;
  fs.mkdirSync(path.dirname(vercelProjectPath), { recursive: true });
  fs.writeFileSync(
    vercelProjectPath,
    JSON.stringify({ projectId, orgId: hit.accountId }, null, 2)
  );
}

console.log(`\nSyncing → Vercel project ${projectId}\n`);

const existing = await api(token, `/v9/projects/${projectId}/env?limit=100`);
for (const key of KEYS) {
  for (const e of (existing.envs || []).filter((row) => row.key === key)) {
    await api(token, `/v9/projects/${projectId}/env/${e.id}`, { method: 'DELETE' });
  }
}

for (const key of KEYS) {
  const value = local[key];
  if (!value) {
    console.log(`○ skip ${key}`);
    continue;
  }
  await api(token, `/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });
  console.log(`✓ ${key} (${String(value).length} chars) → production+preview+development`);
}

console.log('\nDone. Commit/push (or vercel --prod) so the new API + cron deploy with these secrets.\n');
