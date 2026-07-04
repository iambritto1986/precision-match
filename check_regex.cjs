const fs = require('fs');
const app = fs.readFileSync('src/App.tsx', 'utf8');

const adminDashboardRegex = /\{activeTab === 'dashboard' && isAdmin && \([\s\S]*?\{activeTab === 'pricing'/m;
const match = app.match(adminDashboardRegex);
console.log(match ? "Matched!" : "Failed to match!");
