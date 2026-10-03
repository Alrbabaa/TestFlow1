import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Firebase's web configuration identifies the project; it is not a server
// credential. Values are injected by Vite/Vercel and must never contain an
// Admin SDK service-account key.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfigKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingConfigKeys = requiredConfigKeys.filter((key) => !import.meta.env[key]);
export const firebaseConfigError = missingConfigKeys.length
  ? `Firebase is not configured: ${missingConfigKeys.join(', ')}`
  : null;

// Do not initialize Firebase with incomplete configuration. App.tsx renders a
// useful setup screen before any provider attempts to use these exports.
const app = firebaseConfigError ? null : initializeApp(firebaseConfig);
export const auth = (app ? getAuth(app) : undefined) as unknown as Auth;
export const db = (app ? getFirestore(app) : undefined) as unknown as Firestore;
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleAuthProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
