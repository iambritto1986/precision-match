import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, loginWithGoogle as fbLoginWithGoogle, logout as fbLogout } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
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
    try {
      await fbLoginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
         alert("Google Sign-In failed: Domain not authorized in Firebase Console. Please add this domain to Authentication -> Settings -> Authorized Domains.");
      } else {
         alert("Google Sign-In failed: " + error.message);
      }
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    await signInWithEmailAndPassword(auth, e, p);
  };

  const registerWithEmail = async (e: string, p: string) => {
    await createUserWithEmailAndPassword(auth, e, p);
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
