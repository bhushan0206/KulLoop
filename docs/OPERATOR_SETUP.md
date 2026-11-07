# KulLoop operator setup (auth, FCM, Android)

## 1. Firebase ID token API auth

Mutating routes expect `Authorization: Bearer <Firebase ID token>` when the user is signed in.

| Env | Purpose |
|-----|---------|
| `FIREBASE_PROJECT_ID` | Project used to verify ID tokens (recommended on every server) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Admin SDK (required for **sending** FCM) |
| `REQUIRE_FIREBASE_AUTH=true` | Reject unsigned mutations (production). Without this, signed-in headers remain a pilot fallback when no Bearer token is present. |

Demo explore mode still uses `x-kulloop-demo: 1` and does not require a Google token.

Copy `secrets/firebase-service-account.example.json` → `secrets/firebase-service-account.json` (gitignored) and set:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
REQUIRE_FIREBASE_AUTH=true
```

## 2. Android FCM

1. Firebase Console → Project settings → Your apps → Android  
   Package: check `capacitor.config.json` / `android/app/build.gradle` (`org.mydharohar.kulloop` unless changed).
2. Download `google-services.json` into `android/app/` (see `android/app/google-services.json.example`).
3. `pnpm run cap:sync` then rebuild the APK.
4. In app: **Reminders → Push** to register the device token.
5. Server must have the service account above for real delivery (`/api/push/test` and the reminder cron).

## 3. Automated reminders (email + FCM)

| Channel | Status |
|---------|--------|
| **Email** | Automated via SMTP cron (`runReminderWorker`). Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. |
| **Android push** | Automated FCM when service account + device token are registered. |
| **WhatsApp** | **Not automated.** Product uses click-to-chat drafts only (no Meta Cloud / Business API fees). `ENABLE_WHATSAPP=true` only logs a stub. |
| **SMS** | Not built — future phase. |

**Local Node:** in-process interval (`REMINDER_CRON_MS`, default 6h). Disable with `ENABLE_REMINDER_CRON=false`. Manual: `POST /api/reminders/trigger`.

**Vercel:** `setInterval` does not run on serverless. Use Vercel Cron → `GET /api/reminders/cron` (daily `0 8 * * *` UTC in `vercel.json`; Hobby plan allows once/day — Pro can tighten the schedule). Requires `Authorization: Bearer ${CRON_SECRET}` (Vercel injects this automatically when `CRON_SECRET` is set). Upload secrets with:

```bash
npm run sync:vercel-env
```

That pushes SMTP + `FIREBASE_SERVICE_ACCOUNT_JSON` (from `secrets/firebase-service-account.json`) + Firebase client `VITE_*` keys to Production / Preview / Development. Do **not** commit `.env` or the service-account JSON.

Note: the JSON family store (`data/kulloop_store.json`) is ephemeral on Vercel serverless. Local/long-running Node remains the durable pilot host until Blob/DB persistence is added.

## 4. Quick check

```bash
node scripts/check-operator-setup.mjs
```

## 5. Data store

Canonical DB: `data/kulloop_store.json` (created on boot, gitignored).  
Optional cloud mirror: `VITE_FIRESTORE_MIRROR=true` (writes only after REST succeeds).
