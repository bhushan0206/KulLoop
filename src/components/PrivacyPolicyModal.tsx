import React from 'react';
import { X, ShieldCheck, Download, Eye, Users, Bot } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    id: 'scope',
    title: 'What KulLoop is (and is not)',
    icon: ShieldCheck,
    body: [
      'KulLoop is a private family ritual and occasion record for your kul (कुल). It is not a public genealogy directory, astrological marketplace, or ad network.',
      'We help your family track tithi-based shraddhas, birthdays, anniversaries, and sacred days—with reminders you control (WhatsApp links, email, browser alerts).',
    ],
  },
  {
    id: 'data',
    title: 'Data we collect',
    icon: Users,
    body: [
      'Account: Google sign-in email, display name, and profile photo when you choose to authenticate.',
      'Family content you enter: member names, relationships, gotra/kuldaivat notes, occasion dates, ritual notes, and photos you attach to occasions.',
      'Technical: standard app analytics (page views, performance) via Vercel Analytics when deployed—no third-party ad trackers.',
    ],
  },
  {
    id: 'use',
    title: 'How we use your data',
    icon: Eye,
    body: [
      'To calculate and display tithi-aware dates for your chosen tradition (Amanta or Purnimanta).',
      'To send reminders you explicitly configure and to generate priest-ready summaries you choose to share.',
      'Heritage AI (Gemini) only processes prompts you send in-session; do not paste passwords or financial data.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing & family boundaries',
    icon: Users,
    body: [
      'Your family record is private by default. Sharing happens only when you use Share, WhatsApp, or email actions.',
      'Invitees you add as members see only what your family configurator exposes within the app.',
      'We do not sell personal or family data.',
    ],
  },
  {
    id: 'retention',
    title: 'Retention & export',
    icon: Download,
    body: [
      'You may export your database snapshot from Profile & Community / database tools where available.',
      'Pilot families may request deletion by contacting support listed in the Pilot intake flow.',
      'Backups on our servers follow the retention policy of your hosting provider (e.g. Vercel/Firebase).',
    ],
  },
  {
    id: 'ai',
    title: 'AI & children / elders',
    icon: Bot,
    body: [
      'Heritage AI provides cultural context, not legal or medical advice. Elders and youth can use larger text via system font scaling; voice features are optional.',
      'Parents or family leads should supervise minors when adding members or sharing outside the household.',
    ],
  },
] as const;

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm cursor-default"
        aria-label="Close privacy policy"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-stone-50 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200">
        <div className="sticky top-0 bg-stone-50/95 backdrop-blur border-b border-stone-200 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-800 font-semibold">Section 9 · Family Data Boundary</p>
            <h2 id="privacy-policy-title" className="text-xl font-bold text-stone-900 font-serif-display">
              Privacy Policy
            </h2>
            <p className="text-xs text-stone-500 mt-1">Last updated: November 2026 · KulLoop & MyDharohar partnership</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 text-stone-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`privacy-${section.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <section.icon className="w-4 h-4 text-emerald-600" aria-hidden />
                <h3 id={`privacy-${section.id}`} className="text-sm font-bold text-stone-800">
                  {section.title}
                </h3>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-stone-600 leading-relaxed">
                {section.body.map((line) => (
                  <li key={line.slice(0, 40)}>{line}</li>
                ))}
              </ul>
            </section>
          ))}

          <p className="text-xs text-stone-500 border-t border-stone-200 pt-4">
            Questions: use the Pilot intake contact or email your family configurator. For GDPR-style access or deletion requests, include your signed-in Google email and family name.
          </p>
        </div>
      </div>
    </div>
  );
};
