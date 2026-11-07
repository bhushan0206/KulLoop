import React, { useState, useEffect } from 'react';
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
  Check,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { UserProfile, signInWithGoogle, checkRedirectSignInResult } from '../services/firebase';
import { apiValidateInviteCode } from '../services/api';
import { Family, LanguageCode } from '../types';
import { normalizeInviteCode } from '../utils/inviteCode';
import { LandingWelcome } from './LandingWelcome';

interface OnboardingFlowProps {
  onComplete: (
    user: UserProfile,
    familyData: Partial<Family>,
    options?: { intent: 'create' | 'join' }
  ) => void;
  onExploreDemo: () => void;
  /** Returning member — Google sign-in then load their saved family loop (optional profile after OAuth redirect) */
  onReturningSignIn: (existingProfile?: UserProfile) => Promise<void>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onExploreDemo,
  onReturningSignIn,
}) => {
  // Ordered Funnel:
  // 0. Marketing landing (About / Vision / How it works)
  // 1. Family Lineage Setup (Create new or Join via Family Code)
  // 2. Sign-In / Account Link Gate
  // 3. Reminders & Traditions Launch
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [step, setStep] = useState<'welcome' | 'family' | 'auth' | 'tradition'>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states
  const [familyName, setFamilyName] = useState(() => localStorage.getItem('kulloop_pending_family_name') || '');
  const [familyCode, setFamilyCode] = useState(() => localStorage.getItem('kulloop_pending_family_code') || '');
  const [homeLocation, setHomeLocation] = useState('Pune, Maharashtra');
  const [secondLocation, setSecondLocation] = useState('');
  const [convention, setConvention] = useState<'Amanta' | 'Purnimanta'>('Amanta');
  const [traditionNotes, setTraditionNotes] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('mr');
  const [joinValidatedFamily, setJoinValidatedFamily] = useState<Partial<Family> | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isValidatingJoin, setIsValidatingJoin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      setMode('join');
      setFamilyCode(normalizeInviteCode(joinParam));
    }
  }, []);

  // Check if returning from a full-page OAuth redirect
  useEffect(() => {
    checkRedirectSignInResult().then(async (profile) => {
      if (!profile) return;
      const intent = localStorage.getItem('kulloop_auth_intent');
      localStorage.removeItem('kulloop_auth_intent');
      if (intent === 'returning') {
        try {
          await onReturningSignIn(profile);
        } catch (err) {
          console.error('Returning redirect sign-in failed:', err);
        }
        return;
      }
      setUserProfile(profile);
      setStep('tradition');
    });
    // Intentionally once on mount for OAuth redirect resume
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1: Proceed to mandatory authentication
  const handleProceedToAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create' && !familyName.trim()) return;
    if (mode === 'join' && !familyCode.trim()) return;

    if (mode === 'join') {
      setJoinError(null);
      setIsValidatingJoin(true);
      const result = await apiValidateInviteCode(normalizeInviteCode(familyCode));
      setIsValidatingJoin(false);
      if (!result.valid || !result.family) {
        setJoinError(result.message || 'That invite code is not active. Ask your family configurator.');
        return;
      }
      setJoinValidatedFamily(result.family);
    }

    localStorage.setItem('kulloop_pending_family_name', familyName);
    localStorage.setItem('kulloop_pending_family_code', familyCode);
    setStep('auth');
  };

  // Step 2: Authenticate with Google
  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      localStorage.setItem('kulloop_auth_intent', 'onboarding');
      const profile = await signInWithGoogle();
      if (profile) {
        localStorage.removeItem('kulloop_auth_intent');
        setUserProfile(profile);
        setStep('tradition');
      }
      // null → popup blocked, redirect in progress; resume via checkRedirectSignInResult
    } catch (err: any) {
      localStorage.removeItem('kulloop_auth_intent');
      console.error('Sign in error:', err);
      setAuthError(err?.message || 'Authentication failed. Please retry.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Step 3: Complete and launch
  const handleFinishOnboarding = () => {
    if (!userProfile) return;

    if (mode === 'join' && joinValidatedFamily) {
      onComplete(
        userProfile,
        {
          ...joinValidatedFamily,
          configuratorPhone: whatsappNumber.trim() || '+91 98000 00000',
        },
        { intent: 'join' }
      );
      return;
    }

    const newFamId = `fam_${Date.now()}`;
    const customFamily: Partial<Family> = {
      id: newFamId,
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

    onComplete(userProfile, customFamily, { intent: 'create' });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between font-sans selection:bg-amber-400 selection:text-stone-950 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Nav */}
      <header className="border-b border-stone-800/80 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setStep('welcome');
            setMode('create');
          }}
          className="flex items-center gap-2.5 group cursor-pointer transition-opacity hover:opacity-90 focus:outline-none"
          title="KulLoop Home"
        >
          <span className="text-2xl font-bold tracking-tight text-amber-300 font-serif-display group-hover:text-amber-200 transition-colors">
            KulLoop
          </span>
          <span className="text-xs text-stone-400 font-medium hidden sm:inline">
            · Family Tithi Loop (कुललूप)
          </span>
        </a>

        <div className="flex items-center gap-2">
          {step !== 'welcome' && (
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="text-xs text-stone-400 hover:text-amber-200 transition-colors py-1.5 px-2 cursor-pointer"
            >
              About
            </button>
          )}
          <button
            type="button"
            onClick={onExploreDemo}
            className="text-xs text-stone-400 hover:text-amber-200 transition-colors py-1.5 px-3 rounded-lg border border-stone-800 hover:border-amber-500/40 cursor-pointer flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">Explore Demo</span>
            <span className="sm:hidden">Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Landing marketing OR onboarding card */}
      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 z-10 overflow-y-auto">
        {step === 'welcome' ? (
          <LandingWelcome
            onGetStarted={() => setStep('family')}
            onExploreDemo={onExploreDemo}
            onReturningSignIn={onReturningSignIn}
          />
        ) : (
        <div className="max-w-xl w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 my-4">
          
          {/* STEP 1: FAMILY SETUP FIRST OR JOIN EXISTING */}
          {step === 'family' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Step 1: Family Lineage & Tradition</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-display text-white tracking-tight">
                  Welcome to KulLoop
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Start fresh by creating your family’s sacred tithi loop, or join an existing family ledger using a family invite code.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 border border-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'create'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Create New Family</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('join')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'join'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join with Invite Code</span>
                </button>
              </div>

              <form onSubmit={handleProceedToAuth} className="space-y-4 text-xs">
                {mode === 'join' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Family Invite Code (कुटुंब कोड) *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={familyCode}
                        onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. KUL-8942 or GAVHALE-PUNE"
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-3 text-sm font-mono tracking-wider text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-400 shadow-inner uppercase"
                      />
                      <span className="text-[11px] text-stone-400 mt-1.5 block leading-relaxed">
                        Received an invite link or code from your family lead? Enter it here to attach your Google login directly to their shared family ledger.
                        Demo code: <strong className="text-amber-300">KUL-JOSHI</strong> or your family&apos;s code from Share.
                      </span>
                      {joinError && (
                        <p className="text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2 mt-2 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                          {joinError}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                        Family Name (कुटुंबाचे नाव) *
                      </label>
                      <input
                        type="text"
                        required
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="e.g. The Deshmukh Family (देशमुख परिवार) or Gavhale Parivar"
                        className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400 shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>Ancestral Home Location *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={homeLocation}
                          onChange={(e) => setHomeLocation(e.target.value)}
                          placeholder="e.g. Pune, Maharashtra or Varanasi"
                          className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <span className="text-[10px] text-stone-500 mt-0.5 block">Used for local sunrise tithi maths</span>
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
                      <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
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
                )}

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isValidatingJoin}
                    className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 text-stone-950 font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      {isValidatingJoin
                        ? 'Verifying invite…'
                        : mode === 'join'
                          ? 'Verify Code & Sign In with Google'
                          : 'Continue to Sign In & Link Family'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('welcome')}
                    className="w-full text-xs text-stone-400 hover:text-amber-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to About KulLoop</span>
                  </button>
                </div>
              </form>

              {/* Guarantees Strip */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-around text-[10px] text-stone-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Private</span>
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

          {/* STEP 2: MANDATORY SIGN-IN TO LINK FAMILY */}
          {step === 'auth' && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Step 2: Authenticate to Link Family</span>
                </div>
                <h2 className="text-2xl font-bold font-serif-display text-white tracking-tight">
                  Sign In to Link "{familyName}"
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
                  Sign in with your Google account so your family record, shraddhas, and WhatsApp reminders are securely saved to your verified identity.
                </p>
              </div>

              {/* Family Snapshot Pill */}
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-stone-200">{familyName}</div>
                  <div className="text-[11px] text-stone-400">{homeLocation} · {convention} System</div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('family')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer underline"
                >
                  Edit details
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Sign In Button */}
              <div className="space-y-3 pt-1">
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
                  <span>{isLoadingAuth ? 'Signing in with Google...' : 'Continue with Google Account'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setStep('family')}
                  className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Family Details</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT & PREFERENCES (ACCESSED AFTER SIGN IN) */}
          {step === 'tradition' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <span>Step 3 of 3</span>
                  <span>·</span>
                  <span>WhatsApp & Traditions</span>
                </div>
                <h2 className="text-xl font-bold font-serif-display text-white">
                  Reminders & Heritage Notes
                </h2>
                <p className="text-xs text-stone-400">
                  Signed in as <strong className="text-stone-200">{userProfile?.displayName}</strong> ({userProfile?.email}). Configure your notification preferences.
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
                    You can invite other family members inside your dashboard anytime.
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
                  onClick={() => setStep('auth')}
                  className="text-xs text-stone-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Launch My Family Loop</span>
                </button>
              </div>
            </div>
          )}

        </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-stone-900 py-3 text-center text-[11px] text-stone-500 space-x-3">
        <button type="button" onClick={() => setStep('welcome')} className="hover:text-amber-300 transition-colors">
          About KulLoop
        </button>
        <span aria-hidden>·</span>
        <a href="/privacy" className="hover:text-amber-300 transition-colors">
          Privacy
        </a>
        <span aria-hidden>·</span>
        <span>Partnered with MyDharohar</span>
      </footer>
    </div>
  );
};
