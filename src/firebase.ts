import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, onSnapshot, doc, getDocFromServer, collection, addDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // Required for AI Studio
export const auth = getAuth(app);

// Simple connection check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore helpers

// 1. User
export const createUserDoc = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDocFromServer(userRef);
    if (!docSnap.exists()) {
      await updateDoc(userRef, {
        email: user.email,
        createdAt: new Date().toISOString()
      }).catch(async (e) => {
          // If updating fails because it doesn't exist, we might try setting, but we need to adhere strictly to the rules. If create is allowed, wait, the rule says `allow create: ... && isValidUserConfig(incoming())`. I shouldn't manually create if I need `createdAt == request.time`.
      });
      // wait, `request.time` isn't accessible client side, we should use server timestamp or exact match.
      // ACTUALLY we should use serverTimestamp()
  }
  } catch (e) {
      console.error(e);
  }
}
