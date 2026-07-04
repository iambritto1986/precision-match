const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\s*activeTab === 'dashboard' && isAdmin && \([\s\S]*?(?=\{\s*activeTab === 'pricing')/m;
const match = app.match(regex);
if (match) {
  const replacement = `
        {activeTab === 'dashboard' && isAdmin && (
          <FounderDashboard />
        )}
        
        `;
  app = app.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Successfully replaced dashboard block.");
} else {
  console.log("Failed to match dashboard regex! Here is the context:");
  const testRegex = /activeTab === 'dashboard' && isAdmin/;
  const m = app.match(testRegex);
  if (m) {
     console.log(app.substring(m.index - 50, m.index + 200));
  }
}
