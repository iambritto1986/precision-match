const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
const importsToAdd = `
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { FounderDashboard } from './components/FounderDashboard';
`;
app = app.replace("import { doc, onSnapshot,", importsToAdd + "import { doc, onSnapshot,");

// 2. Remove old auth imports
app = app.replace(/import \{ auth, loginWithGoogle, logout, db \} from '\.\/lib\/firebase';/g, "import { auth, db } from './lib/firebase';");
app = app.replace(/import \{ onAuthStateChanged \} from 'firebase\/auth';\n/g, "");

// 3. Replace state and effects
app = app.replace(/const \[user, setUser\] = useState<any>\(null\);\n/g, "const { user, logout, loading } = useAuth();\n");

// Replace onAuthStateChanged block
const authEffectRegex = /const unsubscribe = onAuthStateChanged\(auth, async \(currentUser\) => \{[\s\S]*?return unsubscribe;\n\s*\}, \[\]\);/m;
const authEffectReplacement = `
  useEffect(() => {
    if (loading) return;
    
    if (user && user.uid !== 'local-guest-uid') {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
         if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            setCredits(data.credits ?? 3);
            setIsPro(data.isPro || user.email === 'iambritto1986@gmail.com');
            
            // Trigger onboarding for new users if they haven't seen it
            if (!data.onboardingCompleted) {
              setIsOnboarding(true);
              setOnboardingStep('options');
              updateDoc(userRef, { onboardingCompleted: true });
            }
         } else {
            // Create user
            setDoc(userRef, { 
               email: user.email || '',
               createdAt: new Date().toISOString(),
               credits: 3,
               isPro: user.email === 'iambritto1986@gmail.com',
               onboardingCompleted: true
            });
            setIsOnboarding(true);
            setOnboardingStep('options');
         }
      });
      
      const adminRef = doc(db, 'admins', user.uid);
      getDoc(adminRef).then(snap => {
         if (snap.exists() || user.email === 'iambritto1986@gmail.com') {
            setIsAdmin(true);
            getDocs(collection(db, 'users')).then(usersSnap => {
               const users = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));
               setAdminUsersInfo(users);
            });
         }
      });
      
      return () => unsubscribeUser();
    } else {
      setUserData(null);
      setIsPro(false);
      setIsAdmin(false);
      setAdminUsersInfo([]);
      if (activeTab === 'dashboard') setActiveTab('resume');
    }
  }, [user, loading]);
`;
app = app.replace(authEffectRegex, authEffectReplacement);

// 4. Update the hardcoded admin checks
app = app.replace(/iambrittothomas@gmail\.com/g, "iambritto1986@gmail.com");

// 5. Add AuthModal logic to the return statement
// We inject it right after <div className="flex h-screen overflow-hidden text-slate-200">
const authModalJSX = `
      {(!user && !isGuestMode && !loading) && (
        <AuthModal onGuest={() => setIsGuestMode(true)} />
      )}
`;
app = app.replace(/<div className="flex h-screen overflow-hidden text-slate-200">/g, `<div className="flex h-screen overflow-hidden text-slate-200">\n${authModalJSX}`);

// 6. Add Founder Dashboard logic
// Where it renders activeTab === 'dashboard', it currently renders the generic admin dashboard. 
// We will replace that with <FounderDashboard />
const adminDashboardRegex = /\{activeTab === 'dashboard' && isAdmin && \([\s\S]*?\{activeTab === 'pricing'/m;
const adminDashboardReplacement = `
            {activeTab === 'dashboard' && isAdmin && (
              <FounderDashboard />
            )}
            
            {activeTab === 'pricing'
`;
app = app.replace(adminDashboardRegex, adminDashboardReplacement);

// Remove the inline loginWithGoogle call in the profile section
app = app.replace(/onClick=\{loginWithGoogle\}/g, "onClick={() => setIsGuestMode(false)}");

fs.writeFileSync('src/App.tsx', app);
console.log('App.tsx updated!');
