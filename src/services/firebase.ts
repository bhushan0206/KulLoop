import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

// Default mock/fallback config if firebase-applet-config.json is not yet populated
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForPreviewMode-12345",
  authDomain: "kulloop-app.firebaseapp.com",
  projectId: "kulloop-app",
  storageBucket: "kulloop-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

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

// Get local or server profile
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    // 1. Try server API
    const res = await fetch(`/api/users/${uid}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // ignore
  }

  // 2. Fallback to localStorage
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

// Save profile to backend & localStorage
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  // Save locally
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${profile.uid}`, JSON.stringify(profile));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend sync failed, stored in browser local storage:', err);
    return true;
  }
}

// Fetch all community profiles to connect over shared interests
export async function fetchCommunityProfiles(): Promise<UserProfile[]> {
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
