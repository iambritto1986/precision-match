const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Modals (search for glass-modal)
code = code.replace(/className="glass-modal/g, 'className="modal-container');

// 2. Buttons
code = code.replace(/className="([^"]*)glass-button-primary([^"]*)"/g, 'className="$1btn-primary$2"');
code = code.replace(/className="([^"]*)glass-button-secondary([^"]*)"/g, 'className="$1btn-secondary$2"');

// 3. Sidebars / Panels
// Left Sidebar
code = code.replace(/className="w-64 flex-shrink-0 flex flex-col bg-\[rgba\(10,6,22,0\.6\)\] backdrop-blur-3xl border-r border-white\/\[0\.05\]"/, 
  'className="w-64 flex-shrink-0 flex flex-col sidebar"');
// Main Workspace panel
code = code.replace(/className="[^"]*bg-\[rgba\(15,11,30,0\.35\)\] backdrop-blur-xl border-r border-white\/\[0\.06\][^"]*"/, (match) => {
  return match.replace(/bg-\[rgba\(15,11,30,0\.35\)\] backdrop-blur-xl border-r border-white\/\[0\.06\]/, 'panel');
});

// Resume Preview Container (should probably keep mostly as is, maybe just wrap it?)
// Just leaving the preview container since it needs to remain mostly white for the resume.

// 4. Logo / Top branding
// The logo is defined around "flex items-center space-x-2"
// <h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase">Precision Match</h1>
code = code.replace(/<h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase">Precision Match<\/h1>/,
  '<h1 className="text-lg font-bold text-white tracking-widest uppercase" style={{textShadow: "0 0 10px rgba(0,240,255,0.5)", color: "#00F0FF"}}>Precision Match</h1>');
code = code.replace(/<div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">/,
  '<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{border: "1px solid #00F0FF", boxShadow: "0 0 10px rgba(0,240,255,0.3)"}}>');

// 5. Tabs
// Currently: <div className="flex border-b border-white/[0.06] mb-6">
// Needs: <div className="tab-container">
code = code.replace(/<div className="flex border-b border-white\/\[0\.06\] mb-6">/, '<div className="tab-container">');

// Currently tab buttons:
// <button onClick={() => setWorkspaceSubTab('form')} className={`pb-4 px-1 border-b-2 font-medium text-xs transition-colors ${workspaceSubTab === 'form' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
code = code.replace(/<button\s+onClick=\{\(\) => setWorkspaceSubTab\('form'\)\}\s+className=\{`pb-4 px-1 border-b-2 font-medium text-xs transition-colors \$\{workspaceSubTab === 'form' \? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'\}`\}\s*>/,
  `<button onClick={() => setWorkspaceSubTab('form')} className={\`tab \${workspaceSubTab === 'form' ? 'active' : ''}\`}>`);

code = code.replace(/<button\s+onClick=\{\(\) => setWorkspaceSubTab\('content'\)\}\s+className=\{`pb-4 px-1 border-b-2 font-medium text-xs transition-colors \$\{workspaceSubTab === 'content' \? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'\}`\}\s*>/,
  `<button onClick={() => setWorkspaceSubTab('content')} className={\`tab \${workspaceSubTab === 'content' ? 'active' : ''}\`}>`);

code = code.replace(/<button\s+onClick=\{\(\) => setWorkspaceSubTab\('layout'\)\}\s+className=\{`pb-4 px-1 border-b-2 font-medium text-xs transition-colors \$\{workspaceSubTab === 'layout' \? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'\}`\}\s*>/,
  `<button onClick={() => setWorkspaceSubTab('layout')} className={\`tab \${workspaceSubTab === 'layout' ? 'active' : ''}\`}>`);


// 6. Fix "glass-card" and other cards
code = code.replace(/className="([^"]*)glass-card([^"]*)"/g, 'className="$1card$2"');

// Fix onboarding cards inside the modal to look like tech cards
code = code.replace(/className="border border-white\/10 hover:border-blue-500\/40 hover:shadow-xl hover:shadow-blue-500\/5 rounded-xl p-5 bg-white\/5 hover:bg-white\/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"/g,
  'className="card cursor-pointer flex flex-col items-center justify-center text-center p-5 group" style={{border: "1px solid rgba(0,240,255,0.2)"}}');

code = code.replace(/className="border border-white\/10 hover:border-indigo-500\/40 hover:shadow-xl hover:shadow-indigo-500\/5 rounded-xl p-5 bg-white\/5 hover:bg-white\/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"/g,
  'className="card cursor-pointer flex flex-col items-center justify-center text-center p-5 group" style={{border: "1px solid rgba(181,0,255,0.2)"}}');

code = code.replace(/className="border border-white\/10 hover:border-emerald-500\/40 hover:shadow-xl hover:shadow-emerald-500\/5 rounded-xl p-5 bg-white\/5 hover:bg-white\/10 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"/g,
  'className="card cursor-pointer flex flex-col items-center justify-center text-center p-5 group" style={{border: "1px solid rgba(0,240,255,0.2)"}}');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
