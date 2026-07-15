const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/"qwen\/qwen3\.6-27b"/g, '"meta-llama/llama-4-scout-17b-16e-instruct"');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success model patch 2");
