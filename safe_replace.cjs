const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

for (let i = 1201; i <= 1314; i++) {
    lines[i] = '';
}

lines[1201] = `        {activeTab === 'dashboard' && isAdmin && (
          <FounderDashboard adminUsersInfo={adminUsersInfo} setAdminUsersInfo={setAdminUsersInfo} />
        )}`;

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("App.tsx cleanly sliced!");
