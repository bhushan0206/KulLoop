import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Sparkles,
  MessageSquare,
  Sunrise,
  Users,
  BookOpen,
  LogIn,
  Loader2,
} from 'lucide-react';
import { MYDHAROHAR } from '../constants/mydharohar';
import type { UserProfile } from '../services/firebase';

interface LandingWelcomeProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
  onReturningSignIn: (existingProfile?: UserProfile) => Promise<void>;
}

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'vision', label: 'Vision' },
  { id: 'how', label: 'How it works' },
  { id: 'privacy', label: 'Privacy' },
] as const;

export const LandingWelcome: React.FC<LandingWelcomeProps> = ({
  onGetStarted,
  onExploreDemo,
  onReturningSignIn,
}) => {
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReturning = async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      await onReturningSignIn();
    } catch (err: unknown) {
      setSignInError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 sm:space-y-14 pb-8">
      <nav
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] sm:text-xs text-stone-400"
        aria-label="Learn about KulLoop"
      >
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className="hover:text-amber-200 transition-colors min-h-[36px] px-1"
          >
            {item.label}
          </button>
        ))}
        <span className="hidden sm:inline text-stone-700" aria-hidden>
          ·
        </span>
        <a
          href={MYDHAROHAR.home}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-200 transition-colors min-h-[36px] px-1"
        >
          Prep guides
        </a>
      </nav>

      {/* Hero — brand first */}
      <section className="text-center space-y-5 pt-2" aria-labelledby="landing-hero-title">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400/90 font-medium">
          Family Tithi Loop
        </p>
        <h1
          id="landing-hero-title"
          className="text-4xl sm:text-5xl font-bold font-serif-display text-amber-300 tracking-tight text-balance"
        >
          KulLoop
        </h1>
        <p className="text-base sm:text-lg text-stone-300 max-w-xl mx-auto leading-relaxed text-balance">
          Quiet for most of the year. Useful exactly when it matters — shraddhas, tithi birthdays, and
          sacred days, with calm email and optional push reminders when the day approaches.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-sm transition-colors shadow-md"
          >
            Get started
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleReturning}
            disabled={signingIn}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-100 font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign in to my family
          </button>
        </div>
        {signInError && (
          <p className="text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 max-w-md mx-auto">
            {signInError}
          </p>
        )}
        <button
          type="button"
          onClick={onExploreDemo}
          className="text-xs text-stone-500 hover:text-amber-200 transition-colors underline-offset-2 hover:underline"
        >
          Or explore the Joshi Family demo
        </button>
      </section>

      <section id="about" className="scroll-mt-24 space-y-3 border-t border-stone-800/80 pt-10">
        <h2 className="text-lg font-bold font-serif-display text-amber-200">About us</h2>
        <p className="text-sm text-stone-300 leading-relaxed max-w-2xl">
          KulLoop is an independent family ritual service. One person in the family keeps the ledger of
          occasions; the family receives automated email (and optional Android push) when a day approaches.
          WhatsApp is share-yourself — open a pre-written message from the Reminders hub with no Business
          API fees. SMS and automated WhatsApp broadcasts are a later phase. We are not a daily panchang
          app and we do not sell fear-based astrology.
        </p>
      </section>

      <section id="vision" className="scroll-mt-24 space-y-3 border-t border-stone-800/80 pt-10">
        <h2 className="text-lg font-bold font-serif-display text-amber-200">Vision</h2>
        <p className="text-sm text-stone-300 leading-relaxed max-w-2xl">
          Every generation should be able to honour ancestors and celebrate life events with correct
          tithi timing — without apps for elders, without guilt messaging, and without losing the
          family&apos;s own notes when someone moves cities or countries.
        </p>
        <ul className="grid sm:grid-cols-3 gap-4 pt-2 text-xs text-stone-400">
          <li className="flex gap-2">
            <Heart className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <span>Gratitude over fear — dignity in every reminder.</span>
          </li>
          <li className="flex gap-2">
            <Sunrise className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <span>Local sunrise maths for the home you actually live in.</span>
          </li>
          <li className="flex gap-2">
            <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <span>One family loop across India and the diaspora.</span>
          </li>
        </ul>
      </section>

      <section id="how" className="scroll-mt-24 space-y-4 border-t border-stone-800/80 pt-10">
        <h2 className="text-lg font-bold font-serif-display text-amber-200">How it works</h2>
        <ol className="space-y-4 text-sm text-stone-300">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-semibold text-stone-100">Create or join your family</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Set Amanta or Purnimanta, home location, and invite relatives with a simple code.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-semibold text-stone-100">Record occasions once</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Shraddhas, birthdays, vrats, festivals — with confirmation from elders when needed.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-semibold text-stone-100">Remind calmly</p>
              <p className="text-xs text-stone-400 mt-0.5 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
                Automated email + optional Android push on lead days; WhatsApp click-to-chat when you want
                to message elders yourself — no app install required for them.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section id="privacy" className="scroll-mt-24 space-y-3 border-t border-stone-800/80 pt-10">
        <h2 className="text-lg font-bold font-serif-display text-amber-200">Privacy & trust</h2>
        <p className="text-sm text-stone-300 leading-relaxed max-w-2xl">
          Your family record stays under your control. We do not sell data or push dosha scares. Optional
          preparation guides open on our partner site{' '}
          <a
            href={MYDHAROHAR.home}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 hover:underline"
          >
            MyDharohar
          </a>{' '}
          — they do not receive your private ledger.
        </p>
        <div className="flex flex-wrap gap-4 text-[11px] text-stone-500 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden />
            Private by design
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" aria-hidden />
            <a href="/privacy" className="hover:text-amber-200 underline-offset-2 hover:underline">
              Privacy policy
            </a>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden />
            Zero fear astrology
          </span>
        </div>
      </section>

      <div className="pt-4 flex justify-center">
        <button
          type="button"
          onClick={onGetStarted}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-sm transition-colors"
        >
          Create your family loop
          <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};
