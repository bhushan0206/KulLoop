<div align="center">
<img width="1200" height="475" alt="KulLoop Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# KulLoop — Family Tithi Loop (कुललूप)

**Tithi-aware family occasions loop for Shraddhas, anniversaries, birthdays, and sacred rituals.**
</div>

---

## 🌟 Overview

**KulLoop** is an intelligent ancestral and family ritual tracking system built for Hindu traditions (Amanta & Purnimanta panchang systems). It converts lunar tithis reliably to Gregorian calendar dates, coordinates family rituals across generations, sends automated WhatsApp & Email reminders, generates priest-ready ritual briefs, and provides Gemini AI-powered cultural and astronomical guidance in Marathi, Hindi, and English.

### Key Features

- 🕉️ **Tithi-Aware Lunar Calculation**: Accurately computes solar dates for Shraddhas, Punyatithis, Jayantis, and festival observances across Amanta (Maharashtra, Gujarat, South India) and Purnimanta (North India) traditions.
- 👨‍👩‍👧‍👦 **Visual Family Tree & Lineage**: Interactive family tree map linking gotra, kuldaivat, ancestral roots, and multi-generational lineages.
- 📲 **WhatsApp & Email Reminders**: Instant WhatsApp click-to-chat links and automated background SMTP email dispatch with formatted ritual schedules and priest notes.
- 🤖 **Gemini Cultural & Shastra Assistant**: In-app AI companion explaining shastra rules, tithi timings, and ancestral rites.
- 📋 **Priest-Ready Ritual Briefs**: One-click printable and shareable ritual preparation checklists and sankalpa details.
- 💾 **Dual Storage Engine**: Seamless offline-capable JSON / SQLite persistence with Firebase Firestore sync and Google authentication.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **pnpm** or **npm**

### Installation

1. Clone repository:
   ```bash
   git clone https://github.com/bhushangavhale/KulLoop.git
   cd KulLoop
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install --legacy-peer-deps
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Gemini API key and SMTP credentials.

4. Run development server:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production:
   ```bash
   pnpm build
   pnpm start
   ```

### Android app (Capacitor)

1. Install [Android Studio](https://developer.android.com/studio) and JDK 17+.
2. `npm install` then `npm run build && npx cap add android` (first time only).
3. **Live WebView (recommended for dev):** set `CAPACITOR_SERVER_URL` to your Vercel URL, then `npx cap sync android && npm run android:open`.
4. **Bundled static + remote API:** build with `VITE_API_BASE_URL=https://your-deployment` then `npm run cap:sync`.
5. Run on device/emulator: `npm run android:run`.

Privacy policy is available in-app under **Footer → Privacy** or **More → Privacy policy**.

### Android push (FCM) & API auth

See **[docs/OPERATOR_SETUP.md](docs/OPERATOR_SETUP.md)** and run `node scripts/check-operator-setup.mjs`.

1. Add Firebase project → download `google-services.json` into `android/app/` (template: `android/app/google-services.json.example`).
2. Set `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT_PATH` (template: `secrets/firebase-service-account.example.json`).
3. Production: `REQUIRE_FIREBASE_AUTH=true` so mutations require a Firebase ID token.
4. In app: **Reminders → Push** registers the device; tokens persist via `POST /api/push/register`.

### Family roles

| Role | Capabilities |
|------|----------------|
| **configurator** | Full family control |
| **co_karta** | Edit occasions, invite members, no delete family data |
| **member** | Add occasions, mark performed |
| **viewer** | Read + reminders only |

Assign roles when inviting members; link Google accounts via `authUid` on join.

Mutations on `/api/family`, `/api/occasions`, `/api/members`, and `/api/lineage` enforce the same matrix server-side via headers `x-kulloop-uid`, `x-kulloop-email`, and `x-kulloop-demo` (the web app sets these automatically).

### Scheduled reminders (email + FCM)

The server runs `runReminderWorker` on a interval (`REMINDER_CRON_MS`, default 6h). It matches each member's `leadTime` (7+2, 7, 2, day_of) to upcoming occasions and sends email and/or FCM when category prefs allow. Dedup keys live in `reminderDispatchLog` in `data/kulloop_store.json`. Manual run: `POST /api/reminders/trigger` (configurator / co_karta).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, tsx
- **AI / LLM**: Google Gemini API (`@google/genai`)
- **Database / Auth**: Server JSON store (`data/kulloop_store.json`, created on boot), Google Auth; optional Firestore mirror via `VITE_FIRESTORE_MIRROR=true`
- **Communications**: Nodemailer, WhatsApp Web Link generator, FCM (optional)

Copy `data/kulloop_store.example.json` only if you need a starter file; the server creates an empty store automatically. Do not commit live `kulloop_store.json` (it may contain family PII).

---

## 📄 License

MIT License. Designed with reverence for ancestral traditions.
