const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeTemplates.tsx', 'utf8');
code = code.replace(/data\.personalDetails\.category/g, 'data.personalDetails.name');
code = code.replace(/\{edu\.startDate\}(.*?)\{edu\.endDate\}/g, '{edu.duration}');
code = code.replace(/\{exp\.startDate\}(.*?)\{exp\.endDate\}/g, '{exp.duration}');
fs.writeFileSync('src/components/ResumeTemplates.tsx', code);
console.log('Fixed');
