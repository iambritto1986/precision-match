const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/iambritto1986@gmail\.com/g, 'iambrittothomas@gmail.com');
fs.writeFileSync('src/App.tsx', app);
console.log('Email corrected in App.tsx');
