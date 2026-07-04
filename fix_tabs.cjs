const fs = require('fs');

let formCode = fs.readFileSync('src/components/ResumeFormEditor.tsx', 'utf8');

// Fix tech-input/opacity back to bg-white/opacity or our theme equivalent
formCode = formCode.replace(/tech-input\/\[0\.03\]/g, 'bg-white/[0.03]');
formCode = formCode.replace(/tech-input\/10/g, 'bg-[var(--accent-primary)]/10');
formCode = formCode.replace(/tech-input\/5/g, 'bg-white/5');

fs.writeFileSync('src/components/ResumeFormEditor.tsx', formCode);
