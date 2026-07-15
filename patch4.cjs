const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

content = content.replace(/result\\.nutritionDetails\\?\\.([a-zA-Z]+)\\?\\.value < 10 \\? \\(result\\.nutritionDetails\\?\\.\\1\\?\\.value \\|\\| 0\\)\\.toFixed\\(\\d\\) : Math\\.round\\(result\\.nutritionDetails\\?\\.\\1\\?\\.value \\|\\| 0\\)\\.toString\\(\\)/g,
  "Number((result.nutritionDetails?.$1?.value || 0).toFixed(2)).toString()");

fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
console.log("Success 4");
