const fs = require('fs');
let fb = fs.readFileSync('src/lib/firebase.ts', 'utf8');
fb = fb.replace(
    /console\.error\("Error logging in", error\);/,
    'console.error("Error logging in", error);\n            throw error;'
);
fs.writeFileSync('src/lib/firebase.ts', fb);
console.log("firebase.ts fixed!");
