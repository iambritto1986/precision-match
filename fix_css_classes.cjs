const fs = require('fs');

let formCode = fs.readFileSync('src/components/ResumeFormEditor.tsx', 'utf8');

// Replace the container bg-slate-50/30 with card
formCode = formCode.replace(/bg-slate-50\/30/g, 'bg-transparent');
// Replace bg-slate-50
formCode = formCode.replace(/bg-slate-50/g, 'bg-transparent');

// For the inputs in Work Experience etc.:
// className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
// We want to replace it with:
// className="tech-input w-full rounded-lg px-3 py-1.5 text-sm"
formCode = formCode.replace(/border border-slate-200 /g, '');
formCode = formCode.replace(/focus:outline-none focus:ring-2 focus:ring-blue-500 /g, '');
formCode = formCode.replace(/bg-white/g, 'tech-input');
formCode = formCode.replace(/glass-input/g, 'tech-input');

fs.writeFileSync('src/components/ResumeFormEditor.tsx', formCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/glass-input/g, 'tech-input');
appCode = appCode.replace(/bg-white\/5 border border-white\/10/g, 'tech-input');

// Fix toggle active state
appCode = appCode.replace(/bg-indigo-500/g, 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]');
appCode = appCode.replace(/bg-white\/20/g, 'bg-slate-700');

// Fix the template selector buttons:
// 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
// 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/10'
appCode = appCode.replace(/'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500\/30'/g, "'bg-[var(--accent-primary)] text-black shadow-[0_0_15px_var(--accent-primary)]'");
appCode = appCode.replace(/'bg-white\/5 text-slate-400 hover:bg-white\/10 hover:text-slate-200 border border-white\/10'/g, "'bg-transparent text-slate-400 hover:text-[var(--accent-primary)] border border-slate-700 hover:border-[var(--accent-primary)]'");

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed CSS Classes!');
