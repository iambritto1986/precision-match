const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// 1. Delete lines 569 to 601 (inclusive, 0-indexed 568 to 600)
for (let i = 568; i <= 600; i++) {
    lines[i] = '';
}

// 2. Inject AuthModal right before the closing </div> (line 1784, 0-indexed 1783)
const authModalInject = `
      {(!user && !isGuestMode && !authLoading) && (
        <AuthModal onGuest={() => { setIsGuestMode(true); setIsPro(true); setCredits(100); }} />
      )}
`;
lines[1783] = authModalInject + lines[1783];

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("App.tsx fully patched.");
