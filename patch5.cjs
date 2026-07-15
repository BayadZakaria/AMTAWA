const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

content = content.replace(/result\.nutritionDetails\?\.sugar\?\.value < 10 \? \(result\.nutritionDetails\?\.sugar\?\.value \|\| 0\)\.toFixed\(1\) : Math\.round\(result\.nutritionDetails\?\.sugar\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.sugar?.value || 0).toFixed(2)).toString()");
content = content.replace(/result\.nutritionDetails\?\.saturatedFat\?\.value < 10 \? \(result\.nutritionDetails\?\.saturatedFat\?\.value \|\| 0\)\.toFixed\(1\) : Math\.round\(result\.nutritionDetails\?\.saturatedFat\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.saturatedFat?.value || 0).toFixed(2)).toString()");
content = content.replace(/result\.nutritionDetails\?\.salt\?\.value < 10 \? \(result\.nutritionDetails\?\.salt\?\.value \|\| 0\)\.toFixed\(2\) : Math\.round\(result\.nutritionDetails\?\.salt\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.salt?.value || 0).toFixed(3)).toString()");
content = content.replace(/result\.nutritionDetails\?\.proteins\?\.value < 10 \? \(result\.nutritionDetails\?\.proteins\?\.value \|\| 0\)\.toFixed\(1\) : Math\.round\(result\.nutritionDetails\?\.proteins\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.proteins?.value || 0).toFixed(2)).toString()");
content = content.replace(/result\.nutritionDetails\?\.fiber\?\.value < 10 \? \(result\.nutritionDetails\?\.fiber\?\.value \|\| 0\)\.toFixed\(1\) : Math\.round\(result\.nutritionDetails\?\.fiber\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.fiber?.value || 0).toFixed(2)).toString()");
content = content.replace(/Math\.round\(result\.nutritionDetails\?\.calories\?\.value \|\| 0\)\.toString\(\)/g, "Number((result.nutritionDetails?.calories?.value || 0).toFixed(1)).toString()");

fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
console.log("Success 5");
