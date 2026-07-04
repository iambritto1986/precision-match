const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Inject AuthModal at the end
const idx = app.lastIndexOf('</main>');
if (idx !== -1) {
   const before = app.substring(0, idx);
   const after = app.substring(idx);
   const injection = `
      {(!user && !isGuestMode && !loading) && (
        <AuthModal onGuest={() => { setIsGuestMode(true); setIsPro(true); setCredits(100); }} />
      )}
`;
   app = before + injection + after;
   fs.writeFileSync('src/App.tsx', app);
   console.log("Injected AuthModal!");
} else {
   console.log("Could not find </main>!");
}
