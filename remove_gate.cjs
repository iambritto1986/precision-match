const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the old gate completely.
const gateRegex = /if \(!user && !isGuestMode\) \{[\s\S]*?return \([\s\S]*?<div className="flex h-screen items-center justify-center bg-\[#0a0a0a\] p-4">[\s\S]*?<\/div>\r?\n    \);\r?\n  \}/m;

const match = app.match(gateRegex);
if (match) {
    app = app.replace(gateRegex, '');
    console.log("Old gate removed!");
} else {
    console.log("Old gate NOT matched.");
}

// 2. Replace the user state
app = app.replace(/const \[user, setUser\] = useState<any>\(null\);\r?\n/, "const { user, logout, loading } = useAuth();\n");
if (app.includes('useAuth();')) {
    console.log("User state replaced.");
}

// 3. Fix the onAuthStateChanged effect
const effectStartStr = 'const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {';
const effectEndStr = '}, [activeTab]);';

const effectStartIndex = app.indexOf(effectStartStr);
const effectEndIndex = app.indexOf(effectEndStr, effectStartIndex);

if (effectStartIndex !== -1 && effectEndIndex !== -1) {
    const fullOldEffect = app.substring(effectStartIndex, effectEndIndex + effectEndStr.length);
    const newEffect = `useEffect(() => {
    if (loading) return;
    
    if (user && user.uid !== 'local-guest-uid') {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
         if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            setCredits(data.credits ?? 3);
            setIsPro(data.isPro || user.email === 'iambrittothomas@gmail.com');
            
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
               isPro: user.email === 'iambrittothomas@gmail.com',
               onboardingCompleted: true
            });
            setIsOnboarding(true);
            setOnboardingStep('options');
         }
      });
      
      const adminRef = doc(db, 'admins', user.uid);
      getDoc(adminRef).then(snap => {
         if (snap.exists() || user.email === 'iambrittothomas@gmail.com') {
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
  }, [user, loading, activeTab]);`;

    // Wait, the old effect was wrapped in a useEffect, so we need to find the `useEffect(() => {\n    const unsubscribe...`
    const oldEffectWrapperStart = app.lastIndexOf('useEffect(() => {', effectStartIndex);
    app = app.substring(0, oldEffectWrapperStart) + newEffect + app.substring(effectEndIndex + effectEndStr.length);
    console.log("Effect replaced!");
}

fs.writeFileSync('src/App.tsx', app);
