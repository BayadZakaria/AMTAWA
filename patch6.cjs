const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/nutriments\.sugars_100g \?\? nutriments\.sugars_value \?\? 0/g, "nutriments.sugars_100g ?? nutriments.sugars_value ?? null");
content = content.replace(/nutriments\['energy-kcal_100g'\] \?\? nutriments\['energy-kcal_value'\] \?\? nutriments\['energy-kcal'\] \?\? 0/g, "nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal'] ?? null");
content = content.replace(/nutriments\.proteins_100g \?\? nutriments\.proteins_value \?\? 0/g, "nutriments.proteins_100g ?? nutriments.proteins_value ?? null");
content = content.replace(/nutriments\.fiber_100g \?\? nutriments\.fiber_value \?\? 0/g, "nutriments.fiber_100g ?? nutriments.fiber_value ?? null");
content = content.replace(/nutriments\['saturated-fat_100g'\] \?\? nutriments\['saturated-fat_value'\] \?\? 0/g, "nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? null");
content = content.replace(/nutriments\.salt_100g \?\? nutriments\.salt_value \?\? nutriments\.sodium_100g \?\? 0/g, "nutriments.salt_100g ?? nutriments.salt_value ?? nutriments.sodium_100g ?? null");

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Success 6");
