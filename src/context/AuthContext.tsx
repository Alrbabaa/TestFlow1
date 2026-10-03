import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { isAdminUid, type StoredRole } from '../lib/firestore.ts';

interface AuthContextType {
  user: User | null;
  userRole: 'tester' | 'developer_pending' | 'developer' | 'admin' | null;
  idToken: string | null;
  loading: boolean;
  roleLoading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshUserRole: () => Promise<AuthContextType['userRole']>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<AuthContextType['userRole']>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  const refreshUserRole = async (): Promise<AuthContextType['userRole']> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserRole(null);
      setRoleLoading(false);
      return null;
    }

    setRoleLoading(true);
    try {
      const token = await currentUser.getIdToken();
      setIdToken(token);
      // Admin is enforced independently in Firestore Rules. This early check is
      // only for routing and works before an admin profile document exists.
      if (isAdminUid(currentUser.uid)) {
        setUserRole('admin');
        return 'admin';
      }
      const profileRef = doc(db, 'users', currentUser.uid);
      const profile = await getDoc(profileRef);
      const storedRole = profile.exists() ? profile.data().role as StoredRole : null;
      const role = storedRole === 'developer' || storedRole === 'developer_pending' ? storedRole : null;
      setUserRole(role);
      return role;
    } catch (error) {
      console.warn('Could not load Firestore account role:', error);
      setUserRole(null);
      return null;
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          await refreshUserRole();
        } catch (err) {
          console.warn('Failed to retrieve ID token:', err);
          setIdToken(null);
          setUserRole(null);
          setRoleLoading(false);
        }
      } else {
        setIdToken(null);
        setUserRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      const token = await res.user.getIdToken();
      setIdToken(token);
      await refreshUserRole();
      return res.user;
    } catch (err: any) {
      // User closed the popup or cancelled - normal user interaction, do not treat as fatal error
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return null;
      }
      if (err?.code === 'auth/popup-blocked') {
        console.warn('Google sign-in popup was blocked by the browser.');
        return null;
      }
      console.warn('Sign-in was not completed:', err?.message || err);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIdToken(null);
      setUser(null);
      setUserRole(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
    }
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        idToken,
        loading,
        roleLoading,
        signInWithGoogle,
        signOut,
        getIdToken,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
