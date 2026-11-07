# KulLoop operator setup (auth, FCM, Android, Firestore)

## 1. Firebase ID token API auth

Mutating routes expect `Authorization: Bearer <Firebase ID token>` when the user is signed in.

| Env | Purpose |
|-----|---------|
| `FIREBASE_PROJECT_ID` | Project used to verify ID tokens (recommended on every server) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` | Full Admin SDK (required for **Firestore + FCM**) |
| `FIRESTORE_DATABASE_ID` | Named Firestore DB (same as `VITE_FIREBASE_DATABASE_ID` if using AI Studio DB) |
| `REQUIRE_FIREBASE_AUTH=true` | Reject unsigned mutations (production). Without this, signed-in headers remain a pilot fallback when no Bearer token is present. |

Demo explore mode still uses `x-kulloop-demo: 1` and does not require a Google token.

Copy `secrets/firebase-service-account.example.json` → `secrets/firebase-service-account.json` (gitignored) and set:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
FIRESTORE_DATABASE_ID=your-named-db-or-omit-for-default
REQUIRE_FIREBASE_AUTH=true
```

## 2. Canonical data store (Firestore)

**Family ledger data lives in Cloud Firestore** (Admin SDK on the server). Layout:

- `families/{familyId}` + subcollections `occasions`, `members`, `people`, `lineage`, `pushDevices`
- `families/{familyId}/meta/reminderDispatch`
- `inviteCodes/{CODE}` → `{ familyId }`
- `users/{uid}`

Clients call Express `/api/*`; `firestore.rules` deny direct client writes to family docs.

One-time import from a legacy local JSON backup:

```bash
npm run migrate:firestore
```

Without a service account the API falls back to **in-memory only** (no disk PII writes) — suitable for demo, not production.

## 3. Android FCM

1. Firebase Console → Project settings → Your apps → Android  
   Package: check `capacitor.config.json` / `android/app/build.gradle` (`org.mydharohar.kulloop` unless changed).
2. Download `google-services.json` into `android/app/` (see `android/app/google-services.json.example`).
3. `pnpm run cap:sync` then rebuild the APK.
4. In app: **Reminders → Push** to register the device token.
5. Server must have the service account above for real delivery (`/api/push/test` and the reminder cron).

## 4. Automated reminders (email + FCM)

| Channel | Status |
|---------|--------|
| **Email** | Automated via SMTP cron (`runReminderWorker`). Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`. |
| **Android push** | Automated FCM when service account + device token are registered. |
| **WhatsApp** | **Not automated.** Product uses click-to-chat drafts only (no Meta Cloud / Business API fees). `ENABLE_WHATSAPP=true` only logs a stub. |
| **SMS** | Not built — future phase. |

**Local Node:** in-process interval (`REMINDER_CRON_MS`, default 6h). Disable with `ENABLE_REMINDER_CRON=false`. Manual: `POST /api/reminders/trigger`.

**Vercel:** Use Vercel Cron → `GET /api/reminders/cron` (daily `0 8 * * *` UTC in `vercel.json`). Requires `Authorization: Bearer ${CRON_SECRET}`. Upload secrets with:

```bash
npm run sync:vercel-env
```

That pushes SMTP + `FIREBASE_SERVICE_ACCOUNT_JSON` + `FIRESTORE_DATABASE_ID` + Firebase client `VITE_*` keys. Do **not** commit `.env` or the service-account JSON.

## 5. Quick check

```bash
node scripts/check-operator-setup.mjs
```
