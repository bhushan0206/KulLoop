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

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, tsx
- **AI / LLM**: Google Gemini API (`@google/genai`)
- **Database / Auth**: Embedded JSON store, Firebase Firestore & Google Auth
- **Communications**: Nodemailer, WhatsApp Web Link generator

---

## 📄 License

MIT License. Designed with reverence for ancestral traditions.
