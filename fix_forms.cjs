const fs = require('fs');

// Fix ResumeFormEditor.tsx
let formCode = fs.readFileSync('src/components/ResumeFormEditor.tsx', 'utf8');

// Replace bg-slate-50/30 container with card
formCode = formCode.replace(/border border-slate-200 rounded-xl p-4 bg-slate-50\/30 relative form-card-item/g, 'card p-4 relative form-card-item');

// Replace bg-slate-50 border border-slate-200 (header containers)
formCode = formCode.replace(/bg-slate-50 border border-slate-200/g, 'card border border-[var(--border-color)]');

// Replace inputs inside ResumeFormEditor
// className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
formCode = formCode.replace(/className="[^"]*bg-white[^"]*"/g, (match) => {
    // only for inputs/textareas
    if(match.includes('border-slate-200')) {
        return 'className="tech-input"';
    }
    return match;
});
// There are some inputs like: className="w-full glass-input rounded-lg px-3 py-2 text-sm"
formCode = formCode.replace(/className="[^"]*glass-input[^"]*"/g, 'className="tech-input"');

fs.writeFileSync('src/components/ResumeFormEditor.tsx', formCode);


// Fix App.tsx (Page Layout tab and custom instructions)
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Custom instructions textarea has: className="w-full h-24 glass-input rounded-xl p-4 text-sm resize-none"
appCode = appCode.replace(/className="[^"]*glass-input[^"]*"/g, 'className="tech-input h-24"');

// Select input for fonts
// className="w-full text-xs font-semibold text-slate-200 bg-white/5 border border-white/10 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50"
appCode = appCode.replace(/className="w-full text-xs font-semibold text-slate-200 bg-white\/5 border border-white\/10 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500\/50"/g, 'className="tech-input"');

// Theme selector
appCode = appCode.replace(/className="w-full text-xs font-semibold text-slate-200 bg-white\/5 border border-white\/10 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-pink-500\/50"/g, 'className="tech-input"');

// Theme preview circle
appCode = appCode.replace(/className="w-4 h-4 rounded-full border border-white\/20"/g, 'className="w-4 h-4 rounded-full border border-white/40 shadow-[0_0_8px_currentColor]"');

// Toggle Button
appCode = appCode.replace(/bg-indigo-500/g, 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]');
appCode = appCode.replace(/bg-white\/20/g, 'bg-slate-700');

// Page Layout Container bg-white/5
appCode = appCode.replace(/bg-white\/5 border border-white\/10/g, 'tech-input');

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed forms and layout');
