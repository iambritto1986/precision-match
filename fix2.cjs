const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeTemplates.tsx', 'utf8');
code = code.replace(/pageBreaks\?\.\[\]/g, 'pageBreaks?.[elementId]');
fs.writeFileSync('src/components/ResumeTemplates.tsx', code);
console.log('Fixed');
