import React, { useState } from 'react';
import { 
  Sparkles, 
  LogIn, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Compass, 
  Users, 
  BookOpen, 
  Flame,
  Check
} from 'lucide-react';
import { UserProfile, signInWithGoogle } from '../services/firebase';
import { Family, LanguageCode } from '../types';

interface OnboardingFlowProps {
  onComplete: (user: UserProfile, familyData: Partial<Family>) => void;
  onExploreDemo: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onExploreDemo }) => {
  const [step, setStep] = useState<'auth' | 'family' | 'tradition' | 'ready'>('auth');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Form states
  const [familyName, setFamilyName] = useState('');
  const [homeLocation, setHomeLocation] = useState('Pune, Maharashtra');
  const [secondLocation, setSecondLocation] = useState('');
  const [convention, setConvention] = useState<'Amanta' | 'Purnimanta'>('Amanta');
  const [traditionNotes, setTraditionNotes] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('mr');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        setUserProfile(profile);
        if (profile.displayName && !familyName) {
          const lastName = profile.displayName.split(' ').slice(-1)[0] || '';
          if (lastName) {
            setFamilyName(`The ${lastName} Family`);
          }
        }
        setStep('family');
      }
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Continue as Email / Direct Guest Configurator
  const handleDirectContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const guestUser: UserProfile = {
      uid: `usr_${Date.now()}`,
      username: (familyName || 'family').toLowerCase().replace(/[^a-z0-9]/g, '_'),
      displayName: familyName ? `${familyName} Configurator` : 'Family Configurator',
      email: '',
      photoURL: '',
      bio: 'Family ritual configurator preserving ancestral tithi traditions.',
      interests: ['Ancestral Rites (श्राद्ध)', 'Panchang & Astronomy', 'Family Heritage'],
      homeLocation: homeLocation || 'Pune, Maharashtra',
      tradition: `${convention} (${homeLocation || 'Tradition'})`,
      createdAt: new Date().toISOString(),
      language,
    };
    setUserProfile(guestUser);
    setStep('family');
  };

  const handleFinishOnboarding = () => {
    if (!userProfile) return;

    const customFamily: Partial<Family> = {
      name: familyName.trim() || 'My Family Lineage',
      homeLocation: homeLocation.trim() || 'Pune, Maharashtra',
      secondLocation: secondLocation.trim(),
      convention,
      configuratorName: userProfile.displayName,
      configuratorPhone: whatsappNumber.trim() || '+91 98000 00000',
      traditionNotes: traditionNotes.trim() || `${convention} tradition calendar. Computed for local sunrise.`,
      validationSource: convention === 'Amanta' 
        ? 'Datar Panchang (Amanta) — verified by family pandit'
        : 'Varanasi Nirnaya Panchang (Purnimanta)',
    };

    onComplete(userProfile, customFamily);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between font-sans selection:bg-amber-400 selection:text-stone-950 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Nav */}
      <header className="border-b border-stone-800/80 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-amber-300 font-serif-display">
            KulLoop
          </span>
          <span className="text-xs text-stone-400 font-medium">
            · Family Tithi Loop (कुललूप)
          </span>
        </div>

        <button
          onClick={onExploreDemo}
          className="text-xs text-stone-400 hover:text-amber-200 transition-colors py-1.5 px-3 rounded-lg border border-stone-800 hover:border-amber-500/40 cursor-pointer flex items-center gap-1.5"
        >
          <span>Explore Demo (The Joshi Family)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Interactive Onboarding Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="max-w-xl w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* STEP 1: AUTH & WELCOME */}
          {step === 'auth' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Your Family's Sacred Dates, Always Remembered</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white tracking-tight">
                  Welcome to KulLoop
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                  Enter your family’s shraddhas, birthdays, and rituals once. We calculate exact tithis for your home location and send quiet WhatsApp reminders to the whole family.
                </p>
              </div>

              {/* Sign In Options */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoadingAuth}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-stone-100 text-stone-900 font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isLoadingAuth ? 'Connecting with Google...' : 'Sign in with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="border-t border-stone-800 w-full" />
                  <span className="bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-widest font-mono shrink-0">
                    or setup directly
                  </span>
                </div>

                <form onSubmit={handleDirectContinue} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                      Your Family Name (कुटुंबाचे नाव)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Kulkarni Family or Gavhale Parivar"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Start Family Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Guarantees Strip */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-around text-[10px] text-stone-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Private & Ad-Free</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>No Apps for Elders</span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Zero Fear Astrology</span>
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: FAMILY DETAILS & HOME LOCATION */}
          {step === 'family' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <span>Step 1 of 2</span>
                  <span>·</span>
                  <span>Lineage & Roots</span>
                </div>
                <h2 className="text-xl font-bold font-serif-display text-white">
                  Configure Your Family Loop
                </h2>
                <p className="text-xs text-stone-400">
                  Tithis and sunrise times depend on your ancestral home location.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Family Name
                  </label>
                  <input
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="e.g. The Deshmukh Family (देशमुख परिवार)"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>Ancestral Home Location</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={homeLocation}
                      onChange={(e) => setHomeLocation(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra or Varanasi"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Used for local sunrise calculation</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                      Diaspora Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={secondLocation}
                      onChange={(e) => setSecondLocation(e.target.value)}
                      placeholder="e.g. Toronto, Canada or London, UK"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">For members living overseas</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Calendar Tradition (Panchang Convention)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setConvention('Amanta')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        convention === 'Amanta'
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-xs'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>Amanta (अमांत)</span>
                        {convention === 'Amanta' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Month ends on Amavasya (Maharashtra, Gujarat, South India)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConvention('Purnimanta')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        convention === 'Purnimanta'
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-xs'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>Purnimanta (पूर्णिमांत)</span>
                        {convention === 'Purnimanta' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Month ends on Purnima (North India, Rajasthan, UP, Bihar)
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setStep('auth')}
                  className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('tradition')}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT & PREFERENCES */}
          {step === 'tradition' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <span>Step 2 of 2</span>
                  <span>·</span>
                  <span>WhatsApp & Traditions</span>
                </div>
                <h2 className="text-xl font-bold font-serif-display text-white">
                  Reminders & Heritage Notes
                </h2>
                <p className="text-xs text-stone-400">
                  Choose your notification language and list any family deity traditions.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Your WhatsApp Number (Configurator)
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +91 98220 12345"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    You can add other family members inside your dashboard anytime.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Notification Language (भाषेची निवड)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('mr')}
                      className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                        language === 'mr'
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      मराठी (Marathi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('hi')}
                      className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                        language === 'hi'
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      हिंदी (Hindi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`py-2 px-3 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                        language === 'en'
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                    Family Traditions & Kuldevta Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={traditionNotes}
                    onChange={(e) => setTraditionNotes(e.target.value)}
                    placeholder="e.g. Kuldevta: Khandoba Jejuri. Mahalaya shraddha on same tithi."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setStep('family')}
                  className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launch My Family Loop</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-stone-900 py-3 text-center text-[11px] text-stone-500">
        KulLoop · Partnered with MyDharohar · Designed with reverence for ancestral traditions
      </footer>
    </div>
  );
};
