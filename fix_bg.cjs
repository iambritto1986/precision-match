const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

// Replace body background
code = code.replace(/body\s*\{\s*background:\s*#[0-9a-fA-F]+;\s*color:\s*#[0-9a-fA-F]+;\s*min-height:\s*100vh;\s*overflow:\s*hidden;\s*\}/, 
`body {
  background: #070514;
  color: #f8fafc;
  min-height: 100vh;
  overflow: hidden;
}`);

// Replace #root::before and ::after
code = code.replace(/#root::before\s*\{[^}]+\}\s*#root::after\s*\{[^}]+\}/s,
`#root::before {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(ellipse at 15% -20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
    radial-gradient(ellipse at 85% 120%, rgba(236, 72, 153, 0.25) 0%, transparent 60%);
  background-color: #070514;
  z-index: 0;
  pointer-events: none;
}
#root::after {
  display: none;
}`);

fs.writeFileSync('src/index.css', code);
console.log('Fixed CSS');
