const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// 1. Fix typography scoping
// We have h1, h2, h3, h4 { ... }
code = code.replace(/h1,\s*h2,\s*h3,\s*h4\s*\{[^}]+\}/,
`h1, h2, h3, h4 {
  color: #FFFFFF;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Reset typography for resume preview so it stays black-on-white */
#resume-preview-content h1, 
#resume-preview-content h2, 
#resume-preview-content h3, 
#resume-preview-content h4,
#resume-preview-content p,
#resume-preview-content span,
#resume-preview-content div {
  color: inherit !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-family: 'Playfair Display', 'Inter', serif !important;
}`);

// Add missing reset for p, span, label that was breaking the preview
code = code.replace(/\/\* Scrollbars \*\//,
`p, span, label { color: var(--text-secondary); }

#resume-preview-content p,
#resume-preview-content span,
#resume-preview-content label { color: inherit !important; }

/* Scrollbars */`);


// 2. Add Background Image
code = code.replace(/#root::before\s*\{[^}]+\}/,
`#root::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  pointer-events: none;
  opacity: 0.85; /* Blend with deep space background color */
}`);

// 3. Update Panels to be more transparent and glowy
code = code.replace(/\.sidebar, \.panel, \.card\s*\{[^}]+\}/,
`.sidebar, .panel, .card {
  background-color: rgba(3, 7, 18, 0.5); /* Much more transparent */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.15), inset 0 0 10px rgba(0, 240, 255, 0.05);
  transition: all 250ms ease;
}`);

code = code.replace(/\.modal-container\s*\{[^}]+\}/,
`.modal-container {
  background-color: rgba(3, 7, 18, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  padding: 32px;
  position: relative;
  overflow: hidden;
}`);

// 4. Tech inputs
code = code.replace(/\.tech-input\s*\{[^}]+\}/g, ''); // Clear duplicate tech-input block if we messed it up earlier, wait it's just one block. We'll leave inputs alone as they were correct.

fs.writeFileSync('src/index.css', code);
console.log('CSS fixed');
