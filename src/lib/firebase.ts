import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'default');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error: any) {
        if (error?.code === 'auth/popup-closed-by-user') {
            return null; // User closed the popup — not an error
        }
        console.error("Error logging in", error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logging out", error);
    }
};

// Returns an Authorization header carrying the current user's Firebase ID token,
// so the backend can verify who is calling AI/credit-metered endpoints.
// Returns {} if there is no signed-in user (backend will reject those as 401).
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const current = auth.currentUser;
    if (!current) return {};
    try {
        const token = await current.getIdToken();
        return { Authorization: `Bearer ${token}` };
    } catch (error) {
        console.error("Failed to get ID token", error);
        return {};
    }
};

// Returns a fresh Firebase ID token string, or null if not signed in.
// Used for contexts (like WebSocket setup messages) where a header can't be attached.
export const getIdTokenOrNull = async (): Promise<string | null> => {
    const current = auth.currentUser;
    if (!current) return null;
    try {
        return await current.getIdToken();
    } catch (error) {
        console.error("Failed to get ID token", error);
        return null;
    }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
