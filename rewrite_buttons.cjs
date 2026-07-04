const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Swap Export PDF class to primary
code = code.replace(/className="px-4 py-2 text-xs font-medium glass-button-secondary rounded-xl flex items-center">\s*<FileOutput className="w-3 h-3 mr-2" \/>\s*Export PDF/,
`className="px-4 py-2 text-xs font-medium glass-button-primary rounded-xl flex items-center">
               <FileOutput className="w-3 h-3 mr-2" />
               Export PDF`);

// Swap Download Word class to secondary
code = code.replace(/className="px-4 py-2 text-xs font-medium glass-button-primary rounded-xl flex items-center">\s*<Download className="w-3 h-3 mr-2" \/>\s*Download Word/,
`className="px-4 py-2 text-xs font-medium glass-button-secondary rounded-xl flex items-center">
               <Download className="w-3 h-3 mr-2" />
               Download Word`);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed');
