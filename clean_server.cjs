const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/app\.use\('\/api\/enhance-photo'.*\n?/g, '');

const routeRegex = /app\.post\("\/api\/enhance-photo", async \(req, res\) => \{[\s\S]*?\}\);\n/g;
server = server.replace(routeRegex, '');

fs.writeFileSync('server.ts', server);
console.log("server.ts cleaned");
