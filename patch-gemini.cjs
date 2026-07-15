const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/model: 'gemini-[^']+',\s*/g, '');
content = content.replace(/model: "gemini-[^"]+",\s*/g, '');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success removed gemini");
