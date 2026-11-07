import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: 'What KulLoop is (and is not)',
    body: [
      'KulLoop is a private family ritual and occasion record for your kul (कुल). It is not a public genealogy directory, astrological marketplace, or ad network.',
    ],
  },
  {
    title: 'Data we collect',
    body: [
      'Account data from Google sign-in when you choose to authenticate.',
      'Family content you enter: names, relationships, occasions, ritual notes, and photos you attach.',
      'Technical analytics (Vercel Analytics / Speed Insights) on deployed builds — no ad trackers.',
    ],
  },
  {
    title: 'Sharing & export',
    body: [
      'Your family record is private by default. Sharing happens only when you use Share, WhatsApp, or email actions.',
      'You may export database snapshots where available in Profile & Community.',
    ],
  },
];

export const PrivacyPolicyPage: React.FC = () => (
  <div className="min-h-screen bg-stone-50 text-stone-900">
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800">
      <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden />
          <h1 className="text-lg font-bold font-serif-display text-amber-300">KulLoop Privacy Policy</h1>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-amber-200 hover:text-white min-h-[44px] px-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to app
        </a>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <p className="text-sm text-stone-600">Last updated: November 2026 · KulLoop & MyDharohar partnership</p>
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-base font-bold text-stone-800 mb-2">{section.title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-stone-600 leading-relaxed">
            {section.body.map((line) => (
              <li key={line.slice(0, 48)}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-xs text-stone-500 border-t border-stone-200 pt-6">
        For access or deletion requests, email your family configurator or Pilot intake contact with your signed-in Google email and family name.
      </p>
    </main>
  </div>
);
