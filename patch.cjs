const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `      // --- NEW: AI-Driven Nutritional Analysis (Yuka-style) ---
      if (process.env.GROQ_API_KEY) {
        try {
          const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';
          const analysisPrompt = \`You are a food scientist analyzing a food product from OpenFoodFacts.
Product: \${scanResult.productName}
Ingredients: \${scanResult.ingredients}
Nutritional Data (per 100g): \${JSON.stringify(nutritionDetails)}
Additives: \${additives.join(', ')}
Nutriscore: \${scanResult.nutriscore}
Perform a rigorous "Yuka-style" analysis based EXACTLY on the Nutritional Data provided. Identify 3-4 Qualities and 3-4 Defects.`;

const replacement = `      let medicalContextStr = '';
      if (userAllergyList.length > 0) {
        medicalContextStr += \`\\nUser Allergies: \${userAllergyList.join(', ')}\`;
      }
      if (warnings.length > 0) {
        medicalContextStr += \`\\nHealth Warnings for User: \${warnings.join('; ')}\`;
      }

      // --- NEW: AI-Driven Nutritional Analysis (Yuka-style) ---
      if (process.env.GROQ_API_KEY) {
        try {
          const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';
          const analysisPrompt = \`You are a food scientist analyzing a food product from OpenFoodFacts.
Product: \${scanResult.productName}
Ingredients: \${scanResult.ingredients}
Nutritional Data (per 100g): \${JSON.stringify(nutritionDetails)}
Additives: \${additives.join(', ')}
Nutriscore: \${scanResult.nutriscore}\${medicalContextStr}
Perform a rigorous "Yuka-style" analysis based EXACTLY on the Nutritional Data provided, and strictly penalize any defects relating to the User Allergies or Health Warnings. Identify 3-4 Qualities and 3-4 Defects.`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success!");
} else {
  console.log("Target not found!");
}
