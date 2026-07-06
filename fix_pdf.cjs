const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
    /onClick=\{\(\) => exportToPdf\('resume-preview-content', \`\$\{resumeData\.personalDetails\.name\.replace\(\/ \/g, '_'\)\}_Resume\.pdf\`\)\}/,
    `onClick={() => handleExport('pdf')}`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Fixed PDF export button");
