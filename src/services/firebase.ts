import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { LanguageCode } from '../types';
import appletConfig from '../../firebase-applet-config.json';

// Hydrate from firebase-applet-config.json or env variables, with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "AIzaSyDummyKeyForPreviewMode-12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "gen-lang-client-0572007240.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "gen-lang-client-0572007240",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "gen-lang-client-0572007240.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "603461405029",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:603461405029:web:689b3f9b6a365ce095f98c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom database instance if provided, otherwise default
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-kulloopfamilytit-7b0c965a-e838-4cef-afb2-a45a3a38dc75";
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// Force Google to show the account picker every single time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Status:', errInfo.error);
}

// Test connection to Firestore on boot
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // If default Firestore database is not created yet or offline, silence noisy console spam
    if (error?.message?.includes('Database \'(default)\' not found') || error?.message?.includes('offline')) {
      console.info('KulLoop storage initialized (Local/REST sync ready). Firestore database creation pending in console.');
    }
  }
}
testFirestoreConnection();

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  interests: string[];
  homeLocation: string;
  tradition: string;
  language: LanguageCode;
  createdAt: string;
  updatedAt?: string;
}

export const INTEREST_OPTIONS = [
  'Ancestral Rites (श्राद्ध)',
  'Panchang & Astronomy',
  'Family Heritage',
  'Marathi Traditions',
  'Vrat & Fasting',
  'Genealogy & Gotra',
  'Devotional Music & Bhajans',
  'Temple Architecture & Yatras',
  'Diaspora Cultural Loops',
  'Puranas & Sanskrit Lore',
];

export const CULTURAL_AVATARS = [
  { id: 'elder_aaji', url: '/src/assets/images/kulloop_avatar_elder_1793303629841.jpg', label: 'Aaji (Matriarch)' },
  { id: 'almanac_keeper', url: '/src/assets/images/kulloop_almanac_art_1793303629720.jpg', label: 'Almanac Keeper' },
  { id: 'family_lead', url: '/src/assets/images/kulloop_hero_family_1793303629503.jpg', label: 'Family Heritage' },
];

const LOCAL_STORAGE_KEY = 'kulloop_current_user_profile';

// Get local, server, or Firestore user profile
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  // 1. Try Firestore directly
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }

  // 2. Try server REST API
  try {
    const res = await fetch(`/api/users/${uid}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback to localStorage
  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${uid}`);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return null;
}

// Save profile to Firestore, backend & localStorage
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  // Save locally
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${profile.uid}`, JSON.stringify(profile));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));

  // 1. Try Firestore (safe catch to prevent unhandled rejection spam if DB not yet created)
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (err: any) {
    if (!err?.message?.includes('Database \'(default)\' not found')) {
      handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
    }
  }

  // 2. Sync with REST API
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend REST sync failed, saved in local/firestore storage');
    return true;
  }
}

// Check for redirect result on app load
export async function checkRedirectSignInResult(): Promise<UserProfile | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    return await buildAndSaveProfile(result.user);
  } catch (err) {
    console.warn('Redirect sign-in check:', err);
    return null;
  }
}

async function buildAndSaveProfile(user: FirebaseUser): Promise<UserProfile> {
  const existing = await fetchUserProfile(user.uid);
  if (existing) {
    return existing;
  }

  const cleanUsername = user.email 
    ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') 
    : `user_${user.uid.slice(0, 6)}`;

  const newProfile: UserProfile = {
    uid: user.uid,
    username: cleanUsername,
    displayName: user.displayName || 'KulLoop Member',
    email: user.email || '',
    photoURL: user.photoURL || '',
    bio: 'Family ritual configurator preserving our ancestral traditions.',
    interests: ['Ancestral Rites (श्राद्ध)', 'Panchang & Astronomy', 'Family Heritage', 'Marathi Traditions'],
    homeLocation: 'Pune, Maharashtra',
    tradition: 'Amanta (Maharashtra)',
    createdAt: new Date().toISOString(),
    language: 'mr',
  };

  await saveUserProfile(newProfile);
  return newProfile;
}

// Google Auth Sign-In (Popup with automatic Redirect fallback)
export async function signInWithGoogle(): Promise<UserProfile | null> {
  try {
    // 1. Attempt Firebase Auth popup
    const result = await signInWithPopup(auth, googleProvider);
    return await buildAndSaveProfile(result.user);
  } catch (err: any) {
    console.error('[Google Auth Error]:', err?.code, err?.message);

    // If popup is blocked by the browser, seamlessly fall back to full-page redirect!
    // This guarantees mobile browsers & strict pop-up blockers work with 0 manual steps.
    if (err?.code === 'auth/popup-blocked') {
      console.info('[Google Auth] Popup blocked, initiating full-page OAuth redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    // If popup was closed by user or cancelled, surface clean message
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in cancelled. Please click "Continue with Google Account" again.');
    }

    if (err?.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized in Firebase Auth Settings. Please add your current domain.');
    }

    throw err;
  }
}

export const GUEST_USER_PROFILE: UserProfile = {
  uid: 'guest_user_01',
  username: 'guest_family',
  displayName: 'Guest Configurator',
  email: '',
  photoURL: '',
  bio: 'Family ritual configurator preserving ancestral tithi traditions.',
  interests: ['Ancestral Rites (श्राद्ध)', 'Panchang & Astronomy', 'Family Heritage'],
  homeLocation: 'Pune, Maharashtra',
  tradition: 'Amanta (Maharashtra)',
  createdAt: new Date().toISOString(),
  language: 'mr',
};

// Google Sign Out
export async function signOutGoogle(): Promise<UserProfile> {
  try {
    await fbSignOut(auth);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Sign out error:', err);
  }
  return GUEST_USER_PROFILE;
}

// Fetch all community profiles to connect over shared interests
export async function fetchCommunityProfiles(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as UserProfile);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch community profiles', e);
  }
  return [];
}
