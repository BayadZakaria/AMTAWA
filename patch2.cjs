const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target2 = `      customProducts[barcode] = {
        product_name: productName,
        ingredients_text: ingredients,
        image_url: imageBase64 || '',
        nutriscore_grade: parsedAi.nutriscore_grade,
        allergens_tags: parsedAi.allergens_tags || [],
        additives_tags: parsedAi.additives_tags || []
      };`;

const replacement2 = `      customProducts[barcode] = {
        product_name: productName,
        ingredients_text: ingredients,
        image_url: imageBase64 || '',
        nutriscore_grade: parsedAi.nutriscore_grade,
        allergens_tags: parsedAi.allergens_tags || [],
        additives_tags: parsedAi.additives_tags || [],
        nutriments: parsedAi.nutriments || {}
      };`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success 2");
} else {
  console.log("Target 2 not found!");
}
