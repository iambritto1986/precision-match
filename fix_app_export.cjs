const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state variable
app = app.replace(
    /const \[credits, setCredits\] = useState<number>\(3\);/,
    "const [credits, setCredits] = useState<number>(3);\n  const [downloadsRemaining, setDownloadsRemaining] = useState<number>(1);"
);

// 2. Add downloadsRemaining to onSnapshot fetch
app = app.replace(
    /setCredits\(data\.credits \?\? 3\);/,
    "setCredits(data.credits ?? 3);\n            setDownloadsRemaining(data.downloadsRemaining ?? 1);"
);

// 3. Add downloadsRemaining to new user setDoc
app = app.replace(
    /credits: 3,/,
    "credits: 3,\n                 downloadsRemaining: 1,"
);

// 4. Reset on logout
app = app.replace(
    /setCredits\(3\);/,
    "setCredits(3);\n        setDownloadsRemaining(1);"
);

// 5. Add handleExport function right before handleStartNewResume
const handleExportStr = `
  const handleExport = async (type: 'pdf' | 'docx') => {
    if (isPro) {
      if (type === 'pdf') exportToPdf('resume-preview-content', \`\${resumeData.personalDetails.name.replace(/ /g, '_')}_Resume.pdf\`);
      else exportToDocx(resumeData);
    } else {
      if (downloadsRemaining > 0) {
        if (type === 'pdf') exportToPdf('resume-preview-content', \`\${resumeData.personalDetails.name.replace(/ /g, '_')}_Resume.pdf\`);
        else exportToDocx(resumeData);
        
        const newCount = downloadsRemaining - 1;
        setDownloadsRemaining(newCount);
        if (user && user.uid !== 'local-guest-uid') {
          updateDoc(doc(db, 'users', user.uid), { downloadsRemaining: newCount }).catch(console.error);
        }
      } else {
        showToast("You've used your free download. Upgrade to Pro for unlimited exports.", "error");
        setShowPricing(true);
      }
    }
  };

  const handleStartNewResume`;

app = app.replace(/const handleStartNewResume/g, handleExportStr);

// 6. Replace Export buttons
app = app.replace(
    /onClick=\{\(\) => exportToPdf\([^}]*\}\s*className="px-4 py-2 text-xs font-medium btn-primary rounded-xl flex items-center"/,
    `onClick={() => handleExport('pdf')} className="px-4 py-2 text-xs font-medium btn-primary rounded-xl flex items-center"`
);

app = app.replace(
    /onClick=\{\(\) => exportToDocx\([^}]*\}\s*className="px-4 py-2 text-xs font-medium btn-secondary rounded-xl flex items-center"/,
    `onClick={() => handleExport('docx')} className="px-4 py-2 text-xs font-medium btn-secondary rounded-xl flex items-center"`
);

// 7. Update pricing text
app = app.replace(
    /<li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0\.5 shrink-0"\/> Export to PDF<\/li>/,
    `<li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> 1 Free Download (PDF/Word)</li>`
);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx modified successfully for export gating.");
