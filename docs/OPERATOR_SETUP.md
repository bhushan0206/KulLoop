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

## 3. Quick check

```bash
node scripts/check-operator-setup.mjs
```

## 4. Data store

Canonical DB: `data/kulloop_store.json` (created on boot, gitignored).  
Optional cloud mirror: `VITE_FIRESTORE_MIRROR=true` (writes only after REST succeeds).
