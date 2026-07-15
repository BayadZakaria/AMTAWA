const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target1 = `    try {
      const { barcode, productName, ingredients, imageBase64, language = 'en' } = req.body;
      const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic (Darija/MSA)' : language === 'tzm' ? 'Tamazight' : language;
      const prompt = \`As a food scientist AI, analyze this product. 
      Name: \${productName}
      Ingredients: \${ingredients}
      Analyze the ingredients and provide a Nutriscore (A, B, C, D, or E), a list of common allergens found in these ingredients, and any e-number additives found or inferred.
      TRANSLATE all text output (except the single letter Nutriscore) into \${langName}.
      Format your response ONLY as this exact JSON shape (do not include markdown, just the JSON):
      {
        "nutriscore_grade": "C",
        "allergens_tags": ["list", "of", "translated", "allergens"],
        "additives_tags": ["en:e330"]
      }\`;`;

const replacement1 = `    try {
      const barcode = req.body.barcode;
      const productName = req.body.productName || req.body.product_name;
      const ingredients = req.body.ingredients;
      const imageBase64 = req.body.imageBase64 || req.body.image_base64;
      const language = req.body.language || 'en';
      
      const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic (Darija/MSA)' : language === 'tzm' ? 'Tamazight' : language;
      const prompt = \`As a food scientist AI, analyze this product. 
      Name: \${productName}
      Ingredients: \${ingredients}
      If an image is provided, extract the nutritional values (per 100g) from the nutrition facts label.
      Analyze the ingredients and provide a Nutriscore (A, B, C, D, or E), a list of common allergens found in these ingredients, and any e-number additives found or inferred.
      TRANSLATE all text output (except the single letter Nutriscore) into \${langName}.
      Format your response ONLY as this exact JSON shape (do not include markdown, just the JSON):
      {
        "nutriscore_grade": "C",
        "allergens_tags": ["list", "of", "translated", "allergens"],
        "additives_tags": ["en:e330"],
        "nutriments": {
           "sugars_100g": 12.5,
           "energy-kcal_100g": 350,
           "proteins_100g": 5.2,
           "fiber_100g": 2.1,
           "saturated-fat_100g": 1.5,
           "salt_100g": 0.5
        }
      }\`;`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success 1");
} else {
  console.log("Target 1 not found!");
}
