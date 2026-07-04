const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<AuthModal onGuest=\{\(\) => setIsGuestMode\(true\)\} \/>/;
const replacement = `<AuthModal onGuest={() => { setIsGuestMode(true); setIsPro(true); setCredits(100); }} />`;

if (app.match(regex)) {
   app = app.replace(regex, replacement);
   fs.writeFileSync('src/App.tsx', app);
   console.log("Guest logic fixed.");
} else {
   console.log("AuthModal regex not found.");
}
