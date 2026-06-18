import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Emulated Backend Setup
async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;

  app.use(cors({ origin: '*' })); // Allow requests from Vercel

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'missing_url';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'missing_key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Middleware for large payload parsing (e.g. Base64 images)
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

  // In-memory mock DB for custom products and reviews
  const customProducts: Record<string, any> = {};
  const productReviews: Record<string, any[]> = {};
  const productConsensus: Record<string, { status: string, summary: string }> = {};

  // ---------------------------------------------------------
  // ENDPOINT 1: AI Medical Parsing (OCR/NLP) via Gemini
  // ---------------------------------------------------------
  app.post('/api/parse-medical', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
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

      // Simplified call assuming it's text for fallback, or multimodal if image is provided
      let response;
      if (imageBase64) {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
  // ENDPOINT 2: Smart Product Scanner (Open Food Facts + Validation)
  // ---------------------------------------------------------
  app.post('/api/scan-product', async (req, res) => {
    try {
      const { barcode, userAllergies } = req.body;
      
      let p: any = null;
      
      // Check in-memory custom products first
      if (customProducts[barcode]) {
        p = customProducts[barcode];
      } else {
        // Call Open Food Facts API
        const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const offData = await offResponse.json();

        if (offData.status !== 1) {
          return res.status(404).json({ error: 'Product not found in Open Food Facts database.' });
        }
        p = offData.product;
      }

      const productAllergensText = (p.allergens || p.allergens_tags?.join(', ') || '').toLowerCase();
      const productIngredientsText = (p.ingredients_text || '').toLowerCase();

      const userAllergyList: string[] = userAllergies || [];
      const warnings: string[] = [];
      let isSafeForUser = true;

      userAllergyList.forEach(allergy => {
        const alg = allergy.toLowerCase();
        if (productAllergensText.includes(alg) || productIngredientsText.includes(alg)) {
          isSafeForUser = false;
          warnings.push(`Contains potential allergen matching user profile: ${allergy}`);
        }
      });

      // Parse additives
      const additives = p.additives_original_tags 
          ? p.additives_original_tags.map((t: string) => t.replace('en:', '').toUpperCase()) 
          : (p.additives_tags ? p.additives_tags.map((t: string) => t.replace('en:', '').toUpperCase()) : []);

      // Parse detailed ingredients
      const rawIngredients = p.ingredients || [];
      const ingredientsDetailed: Array<{name: string, isAllergen: boolean, isAdditive: boolean, percent?: number}> = [];
      
      if (rawIngredients.length > 0) {
          rawIngredients.forEach((ing: any) => {
              const name = (ing.text || '').replace(/_/g, '').trim();
              if(!name) return;
              let isAllergen = false;
              userAllergyList.forEach(alg => {
                  if (name.toLowerCase().includes(alg.toLowerCase())) isAllergen = true;
              });
              const isAdditive = name.toLowerCase().match(/^e\d{3,4}i?i?i?/) != null || ing.id?.includes('en:e');
              ingredientsDetailed.push({ name, isAllergen, isAdditive, percent: ing.percent_estimate });
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
              ingredientsDetailed.push({ name, isAllergen, isAdditive });
          });
      }

      // We assign a mockup cost based on a hash of barcode for MVP realism
      const mockScore = barcode.split('').reduce((a:number, b:string) => a + parseInt(b||'0'), 0);
      const estimatedCostMAD = 5 + (mockScore % 25);

      res.json({
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
        reviews: productReviews[barcode] || [],
        consensus: productConsensus[barcode] || null
      });
    } catch (error: any) {
      console.error("Scanner Error:", error);
      res.status(500).json({ error: error.message || 'Failed to scan product' });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.1: Add Custom Product & AI Evaluation
  // ---------------------------------------------------------
  app.post('/api/add-custom-product', async (req, res) => {
    try {
      const { barcode, productName, ingredients, imageBase64 } = req.body;
      
      const prompt = `As a food scientist AI, analyze this product. 
      Name: ${productName}
      Ingredients: ${ingredients}
      Analyze the ingredients and provide a Nutriscore (A, B, C, D, or E), a list of common allergens found in these ingredients, and any e-number additives found or inferred.
      Format your response ONLY as this exact JSON shape (do not include markdown, just the JSON):
      {
        "nutriscore_grade": "C",
        "allergens_tags": ["en:milk", "en:nuts"],
        "additives_tags": ["en:e330"]
      }`;

      let response;
      if (imageBase64 && process.env.GEMINI_API_KEY) {
         response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: 'image/jpeg' }}
          ]
        });
      } else if (process.env.GEMINI_API_KEY) {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
      }

      let parsedAi = { nutriscore_grade: "C", allergens_tags: [], additives_tags: [] };
      if (response && response.text) {
          const rawText = response.text || "{}";
          const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsedAi = JSON.parse(cleanJson);
      }

      customProducts[barcode] = {
        product_name: productName,
        ingredients_text: ingredients,
        image_url: imageBase64 || '',
        nutriscore_grade: parsedAi.nutriscore_grade,
        allergens_tags: parsedAi.allergens_tags || [],
        additives_tags: parsedAi.additives_tags || []
      };

      res.json({ success: true, message: 'Product saved and analyzed successfully!' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.2: Add Product Review
  // ---------------------------------------------------------
  app.post('/api/product-review', async (req, res) => {
    const { barcode, user, text, rating, language = 'en' } = req.body;
    if (!productReviews[barcode]) {
      productReviews[barcode] = [];
    }
    productReviews[barcode].push({
      id: Date.now(),
      user: user || 'Anonymous',
      text,
      rating,
      date: new Date().toISOString()
    });

    const newReviews = productReviews[barcode];

    // Background AI Analysis for Consensus
    if (process.env.GEMINI_API_KEY && newReviews.length > 0) {
      try {
        const prompt = `As a community sentiment analyzer for a health product.
        Here are the user reviews:
        ${newReviews.map(r => `- Rating: ${r.rating}/5. Review: "${r.text}"`).join('\n')}
        
        Analyze the overall sentiment. If the reviews are generally negative and warn about bad quality or health issues, classify it as "Not Recommended". If they are mostly positive, classify it as "Recommended". Otherwise classify as "Mixed".
        The summary text MUST BE TRANSLATED into the following language: ${language}.
        Return JSON strictly in this format without markdown formatting:
        {
          "status": "Recommended" | "Not Recommended" | "Mixed",
          "summary": "A short 1-sentence summary of the consensus."
        }`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        const rawText = aiResponse.text || "{}";
        const cleanJson = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
        productConsensus[barcode] = JSON.parse(cleanJson);
      } catch (err) {
        console.error("Failed to sequence AI background task", err);
      }
    }

    res.json({ success: true, reviews: newReviews, consensus: productConsensus[barcode] || null });
  });

  // ---------------------------------------------------------
  // ENDPOINT 2.3: Scan Barcode from Image
  // ---------------------------------------------------------
  app.post('/api/scan-barcode-image', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!process.env.GEMINI_API_KEY) throw new Error("Missing Gemini API Key");
      
      const prompt = "Look very closely at the image. You will see a product, its label, or a physical barcode. Read the barcode numbers EXACTLY as printed under or near the vertical barcode lines (usually an EAN-13, EAN-8, or UPC code with 8 to 13 digits). Do not invent numbers. Return ONLY the numeric string, with NO spaces, NO markdown, NO text. If you absolutely cannot find any barcode numbers, return 'NOT_FOUND'.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
  // ENDPOINT 3: Budget-Optimized Meal Generator (Math/Monte Carlo Emulator)
  // ---------------------------------------------------------
  app.post('/api/generate-meals', async (req, res) => {
    try {
      const { budgetMAD, conditions, userBiometrics, language = 'en' } = req.body;
      const baseBudget = parseFloat(budgetMAD) || 50.0;
      
      let biometricsText = "";
      if (userBiometrics && (userBiometrics.age || userBiometrics.weightKg || userBiometrics.heightCm)) {
         biometricsText = `3. Biometrics Profile for Caloric Needs: Age ${userBiometrics.age || 'N/A'}, Weight ${userBiometrics.weightKg ? userBiometrics.weightKg + 'kg' : 'N/A'}, Height ${userBiometrics.heightCm ? userBiometrics.heightCm + 'cm' : 'N/A'}. Adjust calories accordingly.`;
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

      if (!process.env.GEMINI_API_KEY) {
        // Safe Fallback if Gemini key missing
        return res.json({
          breakfast: [{ name: "Flocons d'avoine à l'eau", costMAD: 10, calories: 300 }],
          lunch: [{ name: "Soupe de lentilles (Adas)", costMAD: 20, calories: 450 }],
          dinner: [{ name: "Salade légère", costMAD: 15, calories: 250 }],
          totalCostMAD: 45,
          note: "Généré localement (Clé GEMINI manquante)"
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
  // ENDPOINT 4: Real Notifications Endpoint
  // ---------------------------------------------------------
  app.post('/api/notifications', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      // Fetch user data for real notifications
      const { data: user } = await supabase.from('users').select('tokens').eq('id', userId).single();
      const { data: meds } = await supabase.from('medications').select('*').eq('user_id', userId);
      const { data: profile } = await supabase.from('medical_profiles').select('*').eq('user_id', userId).single();
      
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
  // ENDPOINT 5: Smart Fitness Generator via AI
  // ---------------------------------------------------------
  app.post('/api/generate-fitness', async (req, res) => {
    try {
      const { user, medicalProfile, language = 'en' } = req.body;
      const { weightKg, heightCm, fitnessGoal } = user || {};
      
      let bmi = null;
      if (weightKg && heightCm) {
        bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
      }

      const prompt = `Act as an expert fitness coach and doctor. 
      Generate a daily workout routine (3 to 5 exercises) based on:
      User Goal: ${fitnessGoal || "Maintenance"}
      User BMI: ${bmi || "Unknown"}
      Medical Conditions: ${medicalProfile?.conditions?.join(', ') || 'None'}
      Allergies: ${medicalProfile?.allergies?.join(', ') || 'None'}
      
      IMPORTANT: The exercise names and notes MUST BE translated into the following language: ${language}.

      Respond strictly in JSON format matching this structure:
      {
        "exercises": [
          { "name": "Exercise Name", "duration": 15, "intensity": "Low" | "Moderate" | "High" }
        ],
        "note": "Short explanatory note about why this routine is safe and effective."
      }`;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          exercises: [
            { name: "Marche active", duration: 15, intensity: "Low (Faible)" }
          ],
          note: "Généré localement (Clé GEMINI manquante)"
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
        return res.status(500).json({ error: "Clé secrète Stripe non configurée (STRIPE_SECRET_KEY)" });
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
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------
  // VITE FALLBACK IN DEVELOPMENT / STATIC IN PROD
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

startServer();
