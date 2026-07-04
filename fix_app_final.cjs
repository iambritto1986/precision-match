const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Replace lines 80-81:
// 80:     const [authLoading, setAuthLoading] = useState(true);
// 81:     const [user, setUser] = useState<any>(null);
// Replace with:
//         const { user, logout, loading: authLoading } = useAuth();
lines[79] = '    const { user, logout, loading: authLoading } = useAuth();';
lines[80] = ''; // clear line 81 (0-indexed 80)

// Replace lines 128-190
const newEffect = `
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
         if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            setCredits(data.credits ?? 3);
            setIsPro(data.isPro || user.email === 'iambrittothomas@gmail.com');
            
            if (!data.onboardingCompleted) {
              setIsOnboarding(true);
              setOnboardingStep('options');
              updateDoc(userRef, { onboardingCompleted: true });
            }
         } else {
            setDoc(userRef, { 
               email: user.email || '',
               createdAt: new Date().toISOString(),
               credits: 3,
               isPro: user.email === 'iambrittothomas@gmail.com',
               onboardingCompleted: true
            }).catch(e => console.error("Error setting user doc", e));
            setIsOnboarding(true);
            setOnboardingStep('options');
         }
      }, (error) => {
         console.error("Firestore Error User Profile: ", error);
      });

      setIsAdmin(false);
      const adminRef = doc(db, 'admins', user.uid);
      getDoc(adminRef).then(adminSnap => {
          if (adminSnap.exists() || user.email === 'iambrittothomas@gmail.com') {
             setIsAdmin(true);
             getDocs(collection(db, 'users')).then(userSnap => {
                const users = [];
                userSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
                setAdminUsersInfo(users);
             }).catch(e => console.error("Error fetching users for dashboard", e));
          }
      }).catch(e => {
          console.error(e);
          if (user.email === 'iambrittothomas@gmail.com') setIsAdmin(true);
      });
      
      return () => unsubscribeUser();
    } else {
      setUserData(null);
      setCredits(3);
      setIsPro(false);
      setIsAdmin(false);
      setAdminUsersInfo([]);
      if (activeTab === 'dashboard') setActiveTab('resume');
    }
  }, [user, authLoading, activeTab]);
`;

// Replace lines 128-190 (0-indexed 127 to 189)
for (let i = 127; i <= 189; i++) {
    lines[i] = '';
}
lines[127] = newEffect;

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("Fixed App.tsx state and effect!");
