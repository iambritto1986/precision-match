const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\s*activeTab === 'dashboard' && isAdmin && \([\s\S]*?(?=\s*\{\(\!user && \!isGuestMode && \!authLoading\) && \()/m;
const match = app.match(regex);
if (match) {
    const replacement = `{activeTab === 'dashboard' && isAdmin && (
          <FounderDashboard adminUsersInfo={adminUsersInfo} setAdminUsersInfo={setAdminUsersInfo} />
        )}\n        `;
    app = app.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', app);
    console.log("App.tsx dashboard replaced successfully.");
} else {
    console.log("Could not find the dashboard block.");
}
