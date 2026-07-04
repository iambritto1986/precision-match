const fs = require('fs');
let ctx = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

ctx = ctx.replace(
    /const loginWithGoogle = async \(\) => \{\r?\n\s*await fbLoginWithGoogle\(\);\r?\n\s*\};/,
    `const loginWithGoogle = async () => {
    try {
      await fbLoginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
         alert("Google Sign-In failed: Domain not authorized in Firebase Console. Please add this domain to Authentication -> Settings -> Authorized Domains.");
      } else {
         alert("Google Sign-In failed: " + error.message);
      }
    }
  };`
);

fs.writeFileSync('src/context/AuthContext.tsx', ctx);
console.log("AuthContext.tsx fixed!");
