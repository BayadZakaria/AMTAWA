const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const valRegex = /Math\.round\(nutriments\['energy-kcal_100g'\] \?\? nutriments\['energy-kcal_value'\] \?\? nutriments\['energy-kcal'\] \?\? null\)/g;
content = content.replace(valRegex, "(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal'] ?? null) !== null ? Math.round(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal']) : null");

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success 8");
