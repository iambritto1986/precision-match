const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Replace body background
code = code.replace(/body\s*\{\s*background:\s*#[0-9a-fA-F]+;\s*color:\s*#[0-9a-fA-F]+;\s*min-height:\s*100vh;\s*overflow:\s*hidden;\s*\}/, 
`body {
  background: #09090b;
  color: #f8fafc;
  min-height: 100vh;
  overflow: hidden;
}`);

// Replace #root::before and ::after
code = code.replace(/#root::before\s*\{[^}]+\}\s*@keyframes bg-shift\s*\{[^}]+\}\s*#root::after\s*\{[^}]+\}/s,
`#root::before {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
    radial-gradient(circle at 80% 100%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  background-color: #09090b;
  z-index: 0;
  pointer-events: none;
}
#root::after {
  display: none;
}`);

// Replace glass
code = code.replace(/\.glass\s*\{[^}]+\}/,
`.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}`);

// Replace glass:hover
code = code.replace(/\.glass:hover\s*\{[^}]+\}/,
`.glass:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}`);

// Replace glass-subtle
code = code.replace(/\.glass-subtle\s*\{[^}]+\}/,
`.glass-subtle {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.04);
}`);

// Replace glass-dark
code = code.replace(/\.glass-dark\s*\{[^}]+\}/,
`.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}`);

// Replace glass-card
code = code.replace(/\.glass-card\s*\{[^}]+\}/,
`.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: all 250ms ease;
}`);

// Replace glass-card:hover
code = code.replace(/\.glass-card:hover\s*\{[^}]+\}/,
`.glass-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}`);

// Replace glass-sidebar
code = code.replace(/\.glass-sidebar\s*\{[^}]+\}/,
`.glass-sidebar {
  background: rgba(9, 9, 11, 0.6);
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.02);
}`);

// Replace glass-modal
code = code.replace(/\.glass-modal\s*\{[^}]+\}/,
`.glass-modal {
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}`);

// Replace glass-input
code = code.replace(/\.glass-input\s*\{[^}]+\}/,
`.glass-input {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f8fafc !important;
  border-radius: 12px;
  transition: all 200ms ease;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}`);

// Replace glass-input:focus
code = code.replace(/\.glass-input:focus\s*\{[^}]+\}/,
`.glass-input:focus {
  border-color: rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
  background: rgba(255, 255, 255, 0.06) !important;
}`);

// Replace glass-button-primary
code = code.replace(/\.glass-button-primary\s*\{[^}]+\}/,
`.glass-button-primary {
  background: rgba(255, 255, 255, 0.9);
  color: #09090b;
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.05);
  font-weight: 600;
  transition: all 200ms ease;
}`);

// Replace glass-button-primary:hover
code = code.replace(/\.glass-button-primary:hover\s*\{[^}]+\}/,
`.glass-button-primary:hover {
  background: #ffffff;
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}`);

// Replace glass-button-secondary
code = code.replace(/\.glass-button-secondary\s*\{[^}]+\}/,
`.glass-button-secondary {
  background: rgba(255, 255, 255, 0.03);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  transition: all 200ms ease;
}`);

// Replace glass-button-secondary:hover
code = code.replace(/\.glass-button-secondary:hover\s*\{[^}]+\}/,
`.glass-button-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #f8fafc;
}`);

// Replace glass-header
code = code.replace(/\.glass-header\s*\{[^}]+\}/,
`.glass-header {
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(32px) saturate(140%);
  -webkit-backdrop-filter: blur(32px) saturate(140%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}`);

fs.writeFileSync('src/index.css', code);
console.log('Fixed');
