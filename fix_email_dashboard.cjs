const fs = require('fs');
let app = fs.readFileSync('src/components/FounderDashboard.tsx', 'utf8');
app = app.replace(/iambritto1986@gmail\.com/g, 'iambrittothomas@gmail.com');
fs.writeFileSync('src/components/FounderDashboard.tsx', app);
console.log('Email corrected in FounderDashboard.tsx');
