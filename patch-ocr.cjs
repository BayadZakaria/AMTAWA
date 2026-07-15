const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `  // ENDPOINT 2.1: Ajouter un produit personnalisé et évaluation IA`;

const replacement = `  // ENDPOINT 2.0: OCR for Product Label
  // ---------------------------------------------------------
  app.post('/api/ocr-product', async (req, res) => {
    try {
      const { imageBase64, language = 'en' } = req.body;
      const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic (Darija/MSA)' : language === 'tzm' ? 'Tamazight' : language;
      
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'API Key not configured' });
      }

      const prompt = \`Analyze this image of a product package, its ingredients list, or its nutrition label. 
      Extract the product name and the full list of ingredients.
      TRANSLATE the extracted text into \${langName}.
      Format your response ONLY as this exact JSON shape:
      {
        "productName": "extracted product name, or leave empty if not found",
        "ingredients": "extracted ingredients list, or leave empty if not found"
      }\`;

      const response = await callGroq({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/jpeg' }}
        ]
      });

      let parsedAi = { productName: "", ingredients: "" };
      if (response && response.text) {
          const rawText = response.text || "{}";
          const cleanJson = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
          try { parsedAi = JSON.parse(cleanJson); } catch(e) { console.error("Bad JSON", cleanJson); }
      }

      res.json(parsedAi);
    } catch (err: any) {
      console.error('OCR Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ENDPOINT 2.1: Ajouter un produit personnalisé et évaluation IA`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log("Success OCR");
} else {
  console.log("Target OCR not found!");
}
