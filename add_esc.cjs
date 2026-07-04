const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find a good place to add the useEffect, like right before `useEffect(() => { const unsubscribe = auth.onAuthStateChanged...`
const escapeEffect = `
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOnboarding) {
        setIsOnboarding(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboarding]);

`;

code = code.replace(/useEffect\(\(\) => \{\s*const unsubscribe = auth\.onAuthStateChanged/, escapeEffect + '  useEffect(() => {\n    const unsubscribe = auth.onAuthStateChanged');

fs.writeFileSync('src/App.tsx', code);
console.log('Added escape listener');
