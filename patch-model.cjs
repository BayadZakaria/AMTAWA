const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/"llama-3\.2-11b-vision-preview"/g, '"qwen/qwen3.6-27b"');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success model patch");
