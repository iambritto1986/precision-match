const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const gateRegex = /if \(!user\) \{[\s\S]*?return \([\s\S]*?<div className="flex h-screen items-center justify-center bg-\[#0f0b1e\] font-inter relative overflow-hidden">[\s\S]*?<\/div>\r?\n\s*\);\r?\n\s*\}/m;

const match = app.match(gateRegex);
if (match) {
    app = app.replace(gateRegex, '');
    console.log("Old gate removed!");
} else {
    console.log("Old gate NOT matched.");
}
fs.writeFileSync('src/App.tsx', app);
