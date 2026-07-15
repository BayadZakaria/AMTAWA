import express from 'express';
import cors from 'cors';

import path from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Emulated Backend Setup
export const app = express();
function setupApp() {
  app.set('trust proxy', 1);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors({ origin: '*' })); // Allow requests from Vercel

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'missing_url';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'missing_key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Middleware for large payload parsing (e.g. Base64 images)
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  
  // Force Groq API key checks to pass since we are using Ollama locally

  const callGroq = async (options: any) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    let promptText = '';
        let images: string[] = [];

        if (Array.isArray(options.contents)) {
          for (const part of options.contents) {
            if (typeof part === 'string') {
              promptText += part + '\n';
            } else if (part.inlineData) {
              let base64 = part.inlineData.data;
              if (base64.startsWith('data:')) {
                base64 = base64.split(',')[1];
              }
              images.push(base64);
            } else if (part.text) {
              promptText += part.text + '\n';
            }
          }
        } else if (typeof options.contents === 'string') {
          promptText = options.contents;
        }

        if (GROQ_API_KEY) {
          // Use Groq API
          const payload: any = {
            model: images.length > 0 ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile",
            messages: [
              {
                role: "user",
                content: images.length > 0 ? [
                  { type: "text", text: promptText },
                  ...images.map(img => ({
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${img}` }
                  }))
                ] : promptText
              }
            ],
            temperature: 0.1
          };

          try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
              },
              body: JSON.stringify(payload)
            });;

            if (!response.ok) {
              const errText = await response.text();
              console.error("Groq API error:", errText);
              throw new Error(`Groq API error: ${response.status} - ${errText}`);
            }

            const _dataText = await response.text(); let data; try { data = JSON.parse(_dataText); } catch(e) { throw new Error("Invalid API response"); }
            return {
              text: data.choices?.[0]?.message?.content || "{}"
            };
          } catch (error) {
            console.error("Failed to fetch from Groq:", error);
            throw error;
          }
        } else {
          // Use Ollama Local API
          const payload: any = {
            model: "llama3", // default to llama3 for text
            messages: [
              {
                role: "user",
                content: promptText
              }
            ],
            stream: false,
            options: {
              temperature: 0.1
            }
          };

          if (images.length > 0) {
            payload.messages[0].images = images;
            // Ollama requires a vision model to process images. We'll default to llama3.2-vision
            payload.model = "llama3.2-vision"; 
          }

          try {
            const response = await fetch(`${OLLAMA_URL}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });;

            if (!response.ok) {
              const errText = await response.text();
              console.error("Ollama API error:", errText);
              throw new Error(`Ollama API error: ${response.status} - ${errText}`);
            }

            const _dataText = await response.text(); let data; try { data = JSON.parse(_dataText); } catch(e) { throw new Error("Invalid API response"); }
            return {
              text: data.message?.content || "{}"
            };
          } catch (error) {
            console.error("Failed to fetch from Ollama:", error);
            throw error;
          }
        }
  };

  // In-memory mock DB for custom products and reviews
  const customProducts: Record<string, any> = {};
  const productReviews: Record<string, any[]> = {};
  const productConsensus: Record<string, { status: string, summary: string }> = {};

  // Helper for ingredient risk assessment (Yuka-style)
  function assessIngredientRisk(name: string, isAdditive: boolean, isAllergen: boolean, lang: string = 'en') {
    const n = name.toLowerCase();
    
    if (isAllergen) {
      return { 
        risk: 'high' as const, 
        impact: lang === 'fr' ? 'Allergène détecté' : 'Allergen detected'
      };
    }

    if (isAdditive) {
      // High Risk Additives
      if (n.match(/e102|e110|e122|e124|e127|e129|e250|e251|e951|e954|e950/)) {
        return { 
          risk: 'high' as const, 
          impact: lang === 'fr' ? 'Additif à éviter (Controversé)' : 'Additive to avoid (Controversial)'
        };
      }
      // Moderate Risk Additives
      if (n.match(/e211|e202|e150[cd]|e621|e407|e466/)) {
        return { 
          risk: 'moderate' as const, 
          impact: lang === 'fr' ? 'Additif peu recommandé' : 'Additive not recommended'
        };
      }
      // Low Risk
      return { 
        risk: 'low' as const, 
        impact: lang === 'fr' ? 'Additif sans risque majeur' : 'Additve with no major risk'
      };
    }

    // Specific bad ingredients
    if (n.includes('palme') || n.includes('palm')) {
      return { 
        risk: 'moderate' as const, 
        impact: lang === 'fr' ? 'Huile de palme (Impact santé/éco)' : 'Palm oil (Health/Eco impact)'
      };
    }
    if (n.includes('sirop de glucose') || n.includes('sirop de fructose') || n.includes('high fructose')) {
      return { 
        risk: 'moderate' as const, 
        impact: lang === 'fr' ? 'Sucre transformé (IG élevé)' : 'Processed sugar (High GI)'
      };
    }
    if (n.includes('sucre') || n.includes('sugar')) {
      return { 
        risk: 'low' as const, 
        impact: lang === 'fr' ? 'Sucre ajouté' : 'Added sugar'
      };
    }

    return { risk: 'none' as const, impact: '' };
  }

  // ---------------------------------------------------------
  // ENDPOINT 0: Proxy /api/analyze-product vers le Backend Render
  // ---------------------------------------------------------
  app.post('/api/analyze-product', async (req, res) => {
    try {
      const { barcode, user_id, language = 'en' } = req.body;
      
      // 1. Fetch from Open Food Facts
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const _offText = await offResponse.text(); let offData; try { offData = JSON.parse(_offText); } catch(e) { throw new Error("Invalid OFF response"); }
      
      if (offData.status !== 1) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      const product = offData.product;
      const productName = product.product_name || "Produit Inconnu";
      const ingredients = product.ingredients_text || "Non spécifié";
      const allergens = product.allergens_tags?.map((t: string) => t.replace('en:', '')).join(', ') || "Aucun";
      const nutriscore = product.nutriscore_grade?.toUpperCase() || "N/A";
      const image = product.image_url || "";
      
      // Fetch user's medical profile
      let medicalContext = "";
      if (user_id) {
         try {
           const { data: medData } = await supabase.from('medical_profiles').select('*').eq('user_id', user_id).maybeSingle();
           if (medData) {
              medicalContext = `\nL'utilisateur a les conditions médicales suivantes: ${medData.conditions?.join(', ') || 'Aucune'}. ` +
                               `Et les allergies suivantes: ${medData.allergies?.join(', ') || 'Aucune'}.`;
           }
         } catch (e) {
            console.error("Error fetching medical profile for analysis:", e);
         }
      }

      const prompt = `Agis comme un nutritionniste expert. Analyse ce produit:
Nom: ${productName}
Ingrédients: ${ingredients}
Allergènes connus: ${allergens}
Nutriscore: ${nutriscore}
${medicalContext}

Langue demandée: ${language}

Tu dois répondre UNIQUEMENT avec un objet JSON valide (sans markdown) contenant ces clés:
{
  "barcode": "${barcode}",
  "productName": "${productName}",
  "ingredients": "${ingredients}",
  "allergens": "${allergens}",
  "nutriscore": "${nutriscore}",
  "image": "${image}",
  "isSafeForUser": true/false (selon les allergies et conditions de l'utilisateur),
  "warnings": ["avertissement 1", "avertissement 2"],
  "analysis": "Texte d'analyse expliquant si c'est bon ou mauvais pour l'utilisateur, et pourquoi."
}`;

      const aiResponse = await callGroq({
        contents: prompt
      });

      let text = (aiResponse.text || "").trim();
      text = text.replace(/```json\s*/, '').replace(/```\s*/, '');
      
      try {
         const parsedData = JSON.parse(text);
         res.json(parsedData);
      } catch (parseError) {
         console.error("Failed to parse AI response:", text);
         res.json({
            barcode,
            productName,
            ingredients,
            allergens,
            nutriscore,
            image,
            isSafeForUser: true,
            warnings: ["Impossible d'analyser le produit avec l'IA."],
            analysis: "Erreur d'analyse."
         });
      }

    } catch (err: any) {
      console.error("Analyze Error:", err);
      res.status(500).json({ error: "Failed to analyze product: " + err.message });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 1: Analyse Médicale IA (OCR/NLP) via Gemini
  // ---------------------------------------------------------
  app.post('/api/parse-medical', async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not set globally.' });
      }

      const { imageBase64, mimeType, language = 'en' } = req.body;
      
      const prompt = `Analyze this medical document or prescription. 
      Extract any explicit diseases, chronic conditions, and allergies.
      The output translation MUST BE in ${language}.
      Return ONLY a strict JSON object with this exact structure:
      {
        "allergies": ["peanut", "penicillin"],
        "conditions": ["type 2 diabetes", "hypertension"]
      }
      If none are found, return empty arrays.`;

      let response;
      if (imageBase64) {
        response = await callGroq({
          contents: [
            prompt,
            { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' }}
          ]
        });
      } else {
        return res.status(400).json({ error: 'No image data provided.' });
      }

      const rawText = response.text || "{}";
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanJson);
      
      res.json(parsedData);
    } catch (error: any) {
      console.error("Medical Parse Error:", error);
      const errMsg = error?.message || '';
      const errStr = JSON.stringify(error) || '';
      if (
        error?.status === 503 || 
        errMsg.includes("503") || 
        errMsg.includes("quota") || 
        errMsg.includes("demand") ||
        errStr.includes("503") ||
        errStr.includes("UNAVAILABLE")
      ) {
          return res.json({
            allergies: ["API en surcharge (temporaire)"],
            conditions: ["Veuillez réessayer plus tard"]
          });
      }
      res.status(500).json({ error: error.message || 'Failed to parse medical data' });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2: Scanner de Produit Intelligent (Open Food Facts + Validation)
  // ---------------------------------------------------------
  app.post('/api/scan-product', async (req, res) => {
    try {
      const { barcode, userAllergies, user_id, language = 'en' } = req.body;
      
      let p: any = null;
      
      // Check in-memory custom products first
      if (customProducts[barcode]) {
        p = customProducts[barcode];
      } else {
        // Call Open Food Facts API (can specify language if OFF supports but v2 default is general)
        const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const _offText = await offResponse.text(); let offData; try { offData = JSON.parse(_offText); } catch(e) { throw new Error("Invalid OFF response"); }

        if (offData.status !== 1) {
          return res.status(404).json({ error: 'Produit non trouvé dans la base de données AMTAWA.' });
        }
        p = offData.product;
      }

      const productAllergensText = (p.allergens || p.allergens_tags?.join(', ') || '').toLowerCase();
      const productIngredientsText = (p.ingredients_text || '').toLowerCase();
      
      let userAllergyList: string[] = userAllergies || [];
      if (user_id && userAllergyList.length === 0) {
        try {
          const { data: medData } = await supabase.from('medical_profiles').select('*').eq('user_id', user_id).maybeSingle();
          if (medData && medData.allergies) {
            userAllergyList = medData.allergies;
          }
        } catch (e) {
          console.error("Error fetching medical profile for scan-product:", e);
        }
      }
      
      const warnings: string[] = [];
      let isSafeForUser = true;

      const langMap: Record<string, string> = {
        'en': 'Contains potential allergen matching user profile',
        'fr': 'Contient un allergène potentiel correspondant à votre profil',
        'ar': 'يحتوي على مكون قد يسبب لك حساسية بناءً على ملفك',
        'tzm': 'ⵉⵍⴰ ⵢⴰⵏ ⵓⵙⵎⴰⵜⵜⴰⵢ ⵏ ⵓⵙⵎⴰⵜⵜⴰⵢ ⵏ ⵓⵙⵎⴰⵜⵜⴰⵢ' // Approximation
      };
      const warningPrefix = langMap[language] || langMap['en'];

      userAllergyList.forEach(allergy => {
        const alg = allergy.toLowerCase();
        if (productAllergensText.includes(alg) || productIngredientsText.includes(alg)) {
          isSafeForUser = false;
          warnings.push(`${warningPrefix}: ${allergy}`);
        }
      });

      // Parse additives
      const additives = p.additives_original_tags 
          ? p.additives_original_tags.map((t: string) => t.replace('en:', '').toUpperCase()) 
          : (p.additives_tags ? p.additives_tags.map((t: string) => t.replace('en:', '').toUpperCase()) : []);

      // Parse detailed ingredients
      const rawIngredients = p.ingredients || [];
      const ingredientsDetailed: Array<{name: string, isAllergen: boolean, isAdditive: boolean, id?: string, risk?: 'none'|'low'|'moderate'|'high', impact?: string, percent?: number}> = [];
      
      if (rawIngredients.length > 0) {
          rawIngredients.forEach((ing: any) => {
              const name = (ing.text || '').replace(/_/g, '').trim();
              if(!name) return;
              let isAllergen = false;
              userAllergyList.forEach(alg => {
                  if (name.toLowerCase().includes(alg.toLowerCase())) isAllergen = true;
              });
              const isAdditive = name.toLowerCase().match(/^e\d{3,4}i?i?i?/) != null || ing.id?.includes('en:e');
              const additiveId = isAdditive ? (ing.id?.startsWith('en:e') ? ing.id.replace('en:', '').toUpperCase() : (name.match(/^e\d{3,4}/i) ? name.match(/^e\d{3,4}/i)![0].toUpperCase() : undefined)) : undefined;
              const { risk, impact } = assessIngredientRisk(name, isAdditive, isAllergen, language);
              ingredientsDetailed.push({ name, isAllergen, isAdditive, id: additiveId, risk, impact, percent: ing.percent_estimate });
          });
      } else if (p.ingredients_text) {
          p.ingredients_text.split(/[,()]+/).forEach((ingTxt: string) => {
              const name = ingTxt.trim().replace(/_/g, '');
              if(!name) return;
              let isAllergen = false;
              userAllergyList.forEach(alg => {
                  if (name.toLowerCase().includes(alg.toLowerCase())) isAllergen = true;
              });
              const isAdditive = name.toLowerCase().match(/^e\d{3,4}i?i?i?/) != null;
              const additiveId = isAdditive ? (name.match(/^e\d{3,4}/i) ? name.match(/^e\d{3,4}/i)![0].toUpperCase() : undefined) : undefined;
              const { risk, impact } = assessIngredientRisk(name, isAdditive, isAllergen, language);
              ingredientsDetailed.push({ name, isAllergen, isAdditive, id: additiveId, risk, impact });
          });
      }

      // We assign a mockup cost based on a hash of barcode for MVP realism
      const mockScore = barcode.split('').reduce((a:number, b:string) => a + parseInt(b||'0'), 0);
      const estimatedCostMAD = 5 + (mockScore % 25);

      // Nutritional analysis (Yuka-inspired thresholds)
      const nutriments = p.nutriments || {};
      const nutritionDetails = {
        sugar: { 
          value: nutriments.sugars_100g ?? nutriments.sugars_value ?? null, 
          unit: 'g', 
          level: ((nutriments.sugars_100g ?? nutriments.sugars_value ?? null) > 18) ? 'high' : ((nutriments.sugars_100g ?? nutriments.sugars_value ?? null) > 9 ? 'moderate' : 'low'),
          impact: (nutriments.sugars_100g ?? nutriments.sugars_value ?? null) > 18 ? (language === 'fr' ? 'Trop sucré' : 'Too high in sugar') : (language === 'fr' ? 'Peu sucré' : 'Low in sugar')
        },
        calories: { 
          value: (nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal'] ?? null) !== null ? Math.round(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal']) : null, 
          unit: 'kcal', 
          level: ((nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? 0) > 350) ? 'high' : ((nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? 0) > 150 ? 'moderate' : 'low'),
          impact: (nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? 0) > 350 ? (language === 'fr' ? 'Trop calorique' : 'Too many calories') : (language === 'fr' ? 'Faible apport' : 'Low calorie')
        },
        proteins: { 
          value: nutriments.proteins_100g ?? nutriments.proteins_value ?? null, 
          unit: 'g', 
          level: ((nutriments.proteins_100g ?? nutriments.proteins_value ?? null) > 8) ? 'low' : ((nutriments.proteins_100g ?? nutriments.proteins_value ?? null) > 4 ? 'moderate' : 'high'), // Inverted logic: 'low' risk means good source
          impact: (nutriments.proteins_100g ?? nutriments.proteins_value ?? null) > 5 ? (language === 'fr' ? 'Source de protéines' : 'Source of protein') : (language === 'fr' ? 'Peu de protéines' : 'Low protein')
        },
        fiber: { 
          value: nutriments.fiber_100g ?? nutriments.fiber_value ?? null, 
          unit: 'g', 
          level: ((nutriments.fiber_100g ?? nutriments.fiber_value ?? null) > 3.5) ? 'low' : 'moderate',
          impact: (nutriments.fiber_100g ?? nutriments.fiber_value ?? null) > 3 ? (language === 'fr' ? 'Riche en fibres' : 'High in fiber') : (language === 'fr' ? 'Peu de fibres' : 'Low fiber')
        },
        saturatedFat: { 
          value: nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? null, 
          unit: 'g', 
          level: ((nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? null) > 5) ? 'high' : ((nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? null) > 2 ? 'moderate' : 'low'),
          impact: (nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? null) > 5 ? (language === 'fr' ? 'Trop de graisses saturées' : 'Too much saturated fat') : (language === 'fr' ? 'Faible impact' : 'Low impact')
        },
        salt: { 
          value: nutriments.salt_100g ?? nutriments.salt_value ?? nutriments.sodium_100g ?? null, 
          unit: 'g', 
          level: ((nutriments.salt_100g ?? nutriments.salt_value ?? 0) > 1.5) ? 'high' : ((nutriments.salt_100g ?? nutriments.salt_value ?? 0) > 0.6 ? 'moderate' : 'low'),
          impact: (nutriments.salt_100g ?? nutriments.salt_value ?? 0) > 1.5 ? (language === 'fr' ? 'Trop salé' : 'Too salty') : (language === 'fr' ? 'Peu salé' : 'Low salt')
        }
      };

      // Fetch reviews from Supabase
      let fetchedReviews: any[] = productReviews[barcode] || [];
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('barcode', barcode)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
           fetchedReviews = data.map(r => ({
              id: r.id,
              user: r.user_name,
              text: r.review_text,
              rating: r.rating,
              date: r.created_at
           }));
        }
      } catch (err) {
        console.warn("Failed to fetch reviews from Supabase:", err);
      }

      let scanResult: any = {
        barcode,
        productName: p.product_name || 'Unknown Product',
        ingredients: p.ingredients_text || 'Not listed',
        allergens: p.allergens || 'None explicit',
        nutriscore: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : 'N/A',
        image: p.image_url || '',
        isSafeForUser,
        warnings,
        estimatedCostMAD,
        ingredientsDetailed,
        additives,
        nutritionDetails,
        reviews: fetchedReviews,
        consensus: productConsensus[barcode] || null
      };

      let medicalContextStr = '';
      if (userAllergyList.length > 0) {
        medicalContextStr += `\nUser Allergies: ${userAllergyList.join(', ')}`;
      }
      if (warnings.length > 0) {
        medicalContextStr += `\nHealth Warnings for User: ${warnings.join('; ')}`;
      }

      // --- NEW: AI-Driven Nutritional Analysis (Yuka-style) ---
      if (process.env.GROQ_API_KEY) {
        try {
          const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : 'English';
          const analysisPrompt = `You are a food scientist analyzing a food product from OpenFoodFacts.
Product: ${scanResult.productName}
Ingredients: ${scanResult.ingredients}
Nutritional Data (per 100g): ${JSON.stringify(nutritionDetails)}
Additives: ${additives.join(', ')}
Nutriscore: ${scanResult.nutriscore}

Perform a rigorous "Yuka-style" analysis based EXACTLY on the Nutritional Data provided. Identify 3-4 Qualities and 3-4 Defects.
For each item, specify a label (e.g. "Sucre"), a sublabel (explanation), the ACTUAL NUMERICAL value from the Nutritional Data (do NOT round to 0, keep decimals like 0.5 or 1.2), a unit (e.g., "g", "kcal"), and a risk level ("low", "moderate", "high").
If a value is strictly 0 or missing, do NOT invent it.
"low" risk is Green/Good. "moderate" is Orange. "high" is Red.
TRANSLATE ALL OUTPUT TO ${langName}.

Return ONLY valid JSON with this structure:
{
  "defects": [{"id": "sugar", "label": "Sucre", "sublabel": "Trop sucré", "value": 12.5, "unit": "g", "level": "high", "isGood": false}],
  "qualities": [{"id": "fiber", "label": "Fibres", "sublabel": "Excellente source", "value": 4.2, "unit": "g", "level": "low", "isGood": true}],
  "aiScore": 45,
  "aiStatus": "Mauvais",
  "aiSummary": "..."
}`;

          const analysisRes = await callGroq({
            contents: analysisPrompt
          });

          const cleanAnalysisJson = (analysisRes.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
          const analyzed = JSON.parse(cleanAnalysisJson);
          
          if (analyzed.defects || analyzed.qualities) {
            scanResult.aiAnalysis = analyzed;
          }
        } catch (e) {
          console.warn("AI Nutritional Analysis failed, falling back to basic analysis.");
        }
      }

      if (process.env.GROQ_API_KEY && language !== 'en') {
        try {
          const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic (Darija/MSA)' : language === 'tzm' ? 'Tamazight' : language;
          const prompt = `Translate the following product information into ${langName}.
Return ONLY valid JSON matching this exact structure, with the strings translated. Do not include markdown formatting.
JSON:
${JSON.stringify({
  productName: scanResult.productName,
  ingredients: scanResult.ingredients,
  allergens: scanResult.allergens,
  warnings: scanResult.warnings,
  ingredientsDetailed: scanResult.ingredientsDetailed.map(i => i.name)
})}`;

          const translationRes = await callGroq({
             contents: prompt,
          });
          
          const cleanJson = (translationRes.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
          const translated = JSON.parse(cleanJson);
          
          scanResult.productName = translated.productName || scanResult.productName;
          scanResult.ingredients = translated.ingredients || scanResult.ingredients;
          scanResult.allergens = translated.allergens || scanResult.allergens;
          scanResult.warnings = translated.warnings || scanResult.warnings;
          
          if (translated.ingredientsDetailed && Array.isArray(translated.ingredientsDetailed) && translated.ingredientsDetailed.length === scanResult.ingredientsDetailed.length) {
            scanResult.ingredientsDetailed.forEach((ing, i) => {
               if (typeof translated.ingredientsDetailed[i] === 'string') {
                 ing.name = translated.ingredientsDetailed[i];
               }
            });
          }
        } catch(e: any) {
           console.warn(`Scanner translation unavailable (${e?.status || 'API Error'}), using fallback strings.`);
        }
      }
      res.json(scanResult);
    } catch (error: any) {
      console.error("Scanner Error:", error);
      res.status(500).json({ error: error.message || 'Failed to scan product' });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.0: OCR for Product Label
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

      const prompt = `Analyze this image of a product package, its ingredients list, or its nutrition label. 
      Extract the product name and the full list of ingredients.
      TRANSLATE the extracted text into ${langName}.
      Format your response ONLY as this exact JSON shape:
      {
        "productName": "extracted product name, or leave empty if not found",
        "ingredients": "extracted ingredients list, or leave empty if not found"
      }`;

      const response = await callGroq({
        contents: [
          prompt,
          { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/jpeg' }}
        ]
      });

      let parsedAi = { productName: "", ingredients: "" };
      if (response && response.text) {
          const rawText = response.text || "{}";
          const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          try { parsedAi = JSON.parse(cleanJson); } catch(e) { console.error("Bad JSON", cleanJson); }
      }

      res.json(parsedAi);
    } catch (err: any) {
      console.error('OCR Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ENDPOINT 2.1: Ajouter un produit personnalisé et évaluation IA
  // ---------------------------------------------------------
  app.post('/api/add-custom-product', async (req, res) => {
    try {
      const barcode = req.body.barcode;
      const productName = req.body.productName || req.body.product_name;
      const ingredients = req.body.ingredients;
      const imageBase64 = req.body.imageBase64 || req.body.image_base64;
      const language = req.body.language || 'en';
      
      const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic (Darija/MSA)' : language === 'tzm' ? 'Tamazight' : language;
      const prompt = `As a food scientist AI, analyze this product. 
      Name: ${productName}
      Ingredients: ${ingredients}
      If an image is provided, extract the nutritional values (per 100g) from the nutrition facts label.
      Analyze the ingredients and provide a Nutriscore (A, B, C, D, or E), a list of common allergens found in these ingredients, and any e-number additives found or inferred.
      TRANSLATE all text output (except the single letter Nutriscore) into ${langName}.
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
      }`;

      let response;
      if (imageBase64 && process.env.GROQ_API_KEY) {
         response = await callGroq({
          contents: [
            prompt,
            { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/jpeg' }}
          ]
        });
      } else if (process.env.GROQ_API_KEY) {
        response = await callGroq({
          contents: prompt
        });
      }

      let parsedAi = { nutriscore_grade: "C", allergens_tags: [], additives_tags: [] };
      if (response && response.text) {
          const rawText = response.text || "{}";
          const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          try { parsedAi = JSON.parse(cleanJson); } catch(e) { console.error("Bad JSON", cleanJson); }
      }

      customProducts[barcode] = {
        product_name: productName,
        ingredients_text: ingredients,
        image_url: imageBase64 || '',
        nutriscore_grade: parsedAi.nutriscore_grade,
        allergens_tags: parsedAi.allergens_tags || [],
        additives_tags: parsedAi.additives_tags || [],
        nutriments: parsedAi.nutriments || {}
      };

      res.json({ success: true, message: 'Product saved and analyzed successfully!' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.2: Ajouter un avis sur le produit
  // ---------------------------------------------------------
  app.post('/api/product-review', async (req, res) => {
    try {
      const { barcode, user, text, rating, language = 'en' } = req.body;
      
      // Save review to Supabase
      const { error: insertError } = await supabase.from('product_reviews').insert({
        barcode,
        user_name: user || 'Anonymous',
        rating,
        review_text: text
      });
      
      if (insertError) {
         console.warn("Product reviews table might not be created yet, proceeding anyway:", insertError);
      }

      // Fetch all reviews for this barcode
      const { data: reviewsData, error: selectError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('barcode', barcode)
        .order('created_at', { ascending: false });

      let newReviews = [];
      if (!selectError && reviewsData) {
        newReviews = reviewsData.map(r => ({
          id: r.id,
          user: r.user_name,
          text: r.review_text,
          rating: r.rating,
          date: r.created_at
        }));
      } else {
        // Fallback to memory if supabase fails/table not exist
        if (!productReviews[barcode]) productReviews[barcode] = [];
        productReviews[barcode].push({ id: Date.now(), user: user || 'Anonymous', text, rating, date: new Date().toISOString() });
        newReviews = productReviews[barcode];
      }

      // Background AI Analysis for Consensus
      if (process.env.GROQ_API_KEY && newReviews.length > 0) {
        try {
          const prompt = `As a community sentiment analyzer for a health product.
          Here are the user reviews:
          ${newReviews.map((r: any) => `- Rating: ${r.rating}/5. Review: "${r.text}"`).join('\n')}
          
          Analyze the overall sentiment. If the reviews are generally negative and warn about bad quality or health issues, classify it as "Not Recommended". If they are mostly positive, classify it as "Recommended". Otherwise classify as "Mixed".
          The summary text MUST BE TRANSLATED into the following language: ${language}.
          Return JSON strictly in this format without markdown formatting:
          {
            "status": "Recommended" | "Not Recommended" | "Mixed",
            "summary": "A short 1-sentence summary of the consensus."
          }`;

          const aiResponse = await callGroq({
            contents: prompt
          });
          const rawText = aiResponse.text || "{}";
          const cleanJson = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
          try { productConsensus[barcode] = JSON.parse(cleanJson); } catch(e) { console.error("Bad JSON consensus", cleanJson); }
        } catch (err) {
          console.error("Failed to sequence AI background task", err);
        }
      }

      res.json({ success: true, reviews: newReviews, consensus: productConsensus[barcode] || null });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.3: Scanner un code-barres depuis une image
  // ---------------------------------------------------------
  app.post('/api/scan-barcode-image', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!process.env.GROQ_API_KEY) throw new Error("Missing Gemini API Key");
      
      const prompt = "Look very closely at the image. You will see a product, its label, or a physical barcode. Read the barcode numbers EXACTLY as printed under or near the vertical barcode lines (usually an EAN-13, EAN-8, or UPC code with 8 to 13 digits). Do not invent numbers. Return ONLY the numeric string, with NO spaces, NO markdown, NO text. If you absolutely cannot find any barcode numbers, return 'NOT_FOUND'.";
      
      const response = await callGroq({
        contents: [
          prompt,
          { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/jpeg' }} 
        ]
      });
      
      let text = (response.text || "").trim();
      text = text.replace(/[^0-9NOT_FUD]/g, ''); // strip out markdown or random chars
      
      if (text.includes('NOT_FOUND') || !text.match(/\d{8,13}/)) {
        // Fallback: If AI fails, use a mock for demonstration
        console.warn("AI didn't find barcode, generating mock");
        return res.json({ barcode: "3017620422003" }); 
      }
      
      // Return first sequence of digits found
      const match = text.match(/\d+/);
      res.json({ barcode: match ? match[0] : text });
    } catch (err: any) {
      console.error("Barcode scan err", err);
      // Fallback
      res.json({ barcode: "3017620422003" });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 3: Générateur de repas optimisé pour le budget (IA)
  // ---------------------------------------------------------
  app.post('/api/generate-meals', async (req, res) => {
    try {
      const { budgetMAD, budget_mad, conditions, userBiometrics, user_biometrics, language = 'en' } = req.body;
      const baseBudget = parseFloat(budgetMAD || budget_mad) || 50.0;
      
      let biometricsText = "";
      const bio = userBiometrics || user_biometrics || {};
      if (bio.age || bio.weightKg || bio.weight_kg || bio.heightCm || bio.height_cm) {
         biometricsText = `3. Biometrics Profile for Caloric Needs: Age ${bio.age || 'N/A'}, Weight ${bio.weightKg || bio.weight_kg ? (bio.weightKg || bio.weight_kg) + 'kg' : 'N/A'}, Height ${bio.heightCm || bio.height_cm ? (bio.heightCm || bio.height_cm) + 'cm' : 'N/A'}. Adjust calories accordingly.`;
      }
      
      // To simulate a Monte Carlo optimization, we request Gemini to solve the constraint algorithm.
      // We instruct Gemini to act as the mathematical optimizer building 3 meals summing strictly <= budgetMAD
      const prompt = `As a nutritional & financial optimization AI for a Moroccan health tech platform:
      Generate 3 meals (breakfast, lunch, dinner) that adhere strictly to these conditions:
      1. Mathematical Constraint: Total cost must be under exactly ${baseBudget} MAD (Moroccan Dirham).
      2. Health Constraint: Must be healthy for a patient with these conditions: ${(conditions||[]).join(', ') || 'None'}.
      ${biometricsText}
      The language of the response name items MUST BE in ${language}.
      
      Generate a realistic, simulated Monte Carlo optimized combination of local Moroccan market items.
      Format your response ONLY as this exact JSON shape (do not include markdown, just the JSON):
      {
        "breakfast": [{ "name": "Item", "costMAD": 5.50, "calories": 300 }],
        "lunch": [{ "name": "Item", "costMAD": 15.00, "calories": 600 }],
        "dinner": [{ "name": "Item", "costMAD": 15.00, "calories": 500 }],
        "totalCostMAD": 35.50
      }`;

      if (!process.env.GROQ_API_KEY) {
        // Safe Fallback if Gemini key missing
        return res.json({
          breakfast: [{ name: "Flocons d'avoine à l'eau", costMAD: 10, calories: 300 }],
          lunch: [{ name: "Soupe de lentilles (Adas)", costMAD: 20, calories: 450 }],
          dinner: [{ name: "Salade légère", costMAD: 15, calories: 250 }],
          totalCostMAD: 45,
          note: "Généré localement (Clé GEMINI manquante)"
        });
      }

      const response = await callGroq({
        contents: prompt
      });
      
      const rawText = response.text || "{}";
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const plan = JSON.parse(cleanJson);

      // Validate Math Output
      let computedTotal = 0;
      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        (plan[meal] || []).forEach((item: any) => {
          computedTotal += (item.costMAD || 0);
        });
      });
      plan.totalCostMAD = parseFloat(computedTotal.toFixed(2));

      res.json(plan);
    } catch (error: any) {
      console.error("Meal Gen Error:", error);
      // Fallback response for 503 errors and quota limits to prevent the app from failing
      const errMsg = error?.message || '';
      const errStr = JSON.stringify(error) || '';
      if (
        error?.status === 503 || 
        errMsg.includes("503") || 
        errMsg.includes("quota") || 
        errMsg.includes("demand") ||
        errStr.includes("503") ||
        errStr.includes("UNAVAILABLE")
      ) {
          console.log("Serving mock meal plan due to API unavailability.");
          return res.json({
            breakfast: [{ name: "Flocons d'avoine à l'eau", costMAD: 10, calories: 300 }],
            lunch: [{ name: "Soupe de lentilles (Adas)", costMAD: 20, calories: 450 }],
            dinner: [{ name: "Salade légère", costMAD: 15, calories: 250 }],
            totalCostMAD: 45,
            note: "Généré localement (API Indisponible : " + (error?.status || 503) + ")"
          });
      }
      res.status(500).json({ error: error.message || 'Failed to generate meals' });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 4: Endpoint de notifications réelles
  // ---------------------------------------------------------
  app.post('/api/history', async (req, res) => {
    try {
      const { userId, user_id } = req.body;
      const idToUse = userId || user_id;
      if (!idToUse) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const { data: historyData, error } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', idToUse)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
           console.warn("History table not yet created in Supabase (run supabase_schema.sql). Returning empty history.");
        } else {
           console.error("History fetch error:", error.message || error);
        }
        return res.json({ scans: [], meals: [], fitness: [] });
      }

      const scans = historyData.filter(d => d.activity_type === 'scan').map(d => ({ ...d.details, date: d.created_at }));
      const meals = historyData.filter(d => d.activity_type === 'meal').map(d => ({ ...d.details, date: d.created_at }));
      const fitness = historyData.filter(d => d.activity_type === 'fitness').map(d => ({ ...d.details, date: d.created_at }));

      res.json({ scans, meals, fitness });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      const { userId, user_id } = req.body;
      const idToUse = userId || user_id;
      if (!idToUse) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // Fetch user data for real notifications
      const { data: user } = await supabase.from('users').select('tokens').eq('id', idToUse).single();
      const { data: meds } = await supabase.from('medications').select('*').eq('user_id', idToUse);
      const { data: profile } = await supabase.from('medical_profiles').select('*').eq('user_id', idToUse).single();
      
      const notifications = [];
      
      // Token Notification
      if (user && user.tokens <= 2) {
        notifications.push({
          id: 'low_tokens',
          title: 'Solde de Jetons Faible',
          message: `Attention, il ne vous reste que ${user.tokens} jeton(s). Pensez à recharger pour continuer à utiliser l'IA.`,
          time: 'Alerte',
          isRead: false
        });
      }

      // Meds Notification
      if (meds && meds.length > 0) {
        notifications.push({
          id: 'meds_reminder',
          title: 'Rappel de Traitement',
          message: `N'oubliez pas vos traitements actifs : ${meds.map((m: any) => m.name).join(', ')}.`,
          time: 'Aujourd\'hui',
          isRead: false
        });
      }

      // Medical Profile Notification
      if (!profile || (!profile.allergies?.length && !profile.conditions?.length)) {
         notifications.push({
          id: 'missing_profile',
          title: 'Profil Médical Incomplet',
          message: `Veuillez remplir vos conditions médicales dans l'onglet Santé.`,
          time: 'Important',
          isRead: false
        });
      }

      notifications.push({
         id: 'system_active',
         title: 'Système Actif',
         message: 'Connexion établie. Assistant prêt.',
         time: 'Récemment',
         isRead: false
      });

      res.json({ status: "success", notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error retrieving notifications" });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 5: Générateur de fitness intelligent (IA)
  // ---------------------------------------------------------
  app.post('/api/generate-fitness', async (req, res) => {
    try {
      const { user, medicalProfile, medical_profile, language = 'en' } = req.body;
      const medProf = medicalProfile || medical_profile;
      const { weightKg, heightCm, fitnessGoal } = user || {};
      
      let bmi = null;
      if (weightKg && heightCm) {
        bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
      }

      const prompt = `Act as an expert fitness coach and doctor. 
      Generate a daily workout routine (3 to 5 exercises) based on:
      User Goal: ${fitnessGoal || "Maintenance"}
      User BMI: ${bmi || "Unknown"}
      Medical Conditions: ${medProf?.conditions?.join(', ') || 'None'}
      Allergies: ${medProf?.allergies?.join(', ') || 'None'}
      
      IMPORTANT: The exercise names and notes MUST BE translated into the following language: ${language}.

      Respond strictly in JSON format matching this structure:
      {
        "exercises": [
          { "name": "Exercise Name", "duration": 15, "intensity": "Low" | "Moderate" | "High" }
        ],
        "note": "Short explanatory note about why this routine is safe and effective."
      }`;

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          exercises: [
            { name: "Marche active", duration: 15, intensity: "Low (Faible)" }
          ],
          note: "Généré localement (Clé GEMINI manquante)"
        });
      }

      const response = await callGroq({
        contents: prompt
      });
      
      const rawText = response.text || "{}";
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const plan = JSON.parse(cleanJson);
      

      res.json(plan);
    } catch (error: any) {
      console.error("Fitness Gen Error:", error);
      const errMsg = error?.message || '';
      const errStr = JSON.stringify(error) || '';
      if (
        error?.status === 503 || 
        errMsg.includes("503") || 
        errMsg.includes("quota") || 
        errMsg.includes("demand") ||
        errStr.includes("503") ||
        errStr.includes("UNAVAILABLE")
      ) {
          return res.json({
            exercises: [
              { name: "Marche active", duration: 15, intensity: "Low (Faible)" },
              { name: "Étirements légers", duration: 10, intensity: "Low (Faible)" }
            ],
            note: "API Indisponible - utilisation d'exercices de base sécurisés."
          });
      }
      res.status(500).json({ error: error.message || 'Failed to generate fitness plan' });
    }
  });

  // ---------------------------------------------------------
  // STRIPE CHECKOUT EMBEDDED
  // ---------------------------------------------------------
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { tokens, priceMAD, origin } = req.body;
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeKey) {
        let baseUrl = origin;
        if (!baseUrl || baseUrl.includes('localhost')) {
           const referer = req.headers.referer;
           if (referer) baseUrl = new URL(referer).origin;
           else {
              const host = req.headers['x-forwarded-host'] || req.headers.host;
              const proto = req.headers['x-forwarded-proto'] || req.protocol;
              baseUrl = `${proto}://${host}`;
           }
        }
        return res.json({ id: "mock_session", url: `${baseUrl}/?success=true&purchased_tokens=${tokens}` });
      }

      const stripeClient = new Stripe(stripeKey);
      
      let baseUrl = origin;
      if (!baseUrl || baseUrl.includes('localhost')) {
         const referer = req.headers.referer;
         if (referer) {
            baseUrl = new URL(referer).origin;
         } else {
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const proto = req.headers['x-forwarded-proto'] || req.protocol;
            baseUrl = `${proto}://${host}`;
         }
      }

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mad',
              product_data: {
                name: `Pack de ${tokens} Jetons`,
                description: "Crédit IA NutriScan / MedScan",
              },
              unit_amount: Math.round(priceMAD * 100), // En centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/?success=true&purchased_tokens=${tokens}`,
        cancel_url: `${baseUrl}/?canceled=true`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------
  // VITE FALLBACK IN DEVELOPMENT / STATIC IN PROD
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    import('vite').then((viteModule) => viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }))
    .then(v => app.use(v.middlewares));
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) { app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

}
setupApp();
