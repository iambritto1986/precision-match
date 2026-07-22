import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, loginWithGoogle as fbLoginWithGoogle, logout as fbLogout, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const result = await fbLoginWithGoogle();
    // Ensure Firestore doc exists for Google users
    const userRef = doc(db, 'users', result.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        createdAt: new Date().toISOString(),
        credits: 3,
        downloadsRemaining: 1,
        isPro: false,
        onboardingCompleted: false,
        freeInterviewUsed: false,
        freeChatMessagesUsed: 0
      });
    }
    return result;
  };

  const loginWithEmail = async (e: string, p: string) => {
    await signInWithEmailAndPassword(auth, e, p);
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Immediately create Firestore user doc
    const userRef = doc(db, 'users', cred.user.uid);
    await setDoc(userRef, {
      email: cred.user.email || '',
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      credits: 3,
      downloadsRemaining: 1,
      isPro: false,
      onboardingCompleted: false,
      freeInterviewUsed: false,
      freeChatMessagesUsed: 0
    });
    return cred;
  };

  const logout = async () => {
    await fbLogout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
