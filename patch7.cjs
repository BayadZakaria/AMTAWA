const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

content = content.replace(/value: Number\(\(result\.nutritionDetails\?\.([a-zA-Z]+)\?\.value \|\| 0\)\.toFixed\(\d+\)\)\.toString\(\)/g, "value: result.nutritionDetails?.$1?.value != null ? Number((result.nutritionDetails?.$1?.value).toFixed(2)).toString() : '?'");

fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
console.log("Success 7");
