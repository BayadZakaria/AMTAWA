import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GROQ_API_KEY });
async function main() {
  const analysisPrompt = `You are a food scientist analyzing a food product from OpenFoodFacts.
Product: Nutella
Ingredients: Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithin (soya), vanillin.
Nutritional Data (per 100g): {"sugar": {"value": 56}}
Additives: E322
Nutriscore: E
Perform a rigorous "Yuka-style" analysis based EXACTLY on the Nutritional Data provided. Identify 3-4 Qualities and 3-4 Defects.
For each item, specify a label (e.g. "Sucre"), a sublabel (explanation), the ACTUAL NUMERICAL value from the Nutritional Data (do NOT round to 0, keep decimals like 0.5 or 1.2), a unit (e.g., "g", "kcal"), and a risk level ("low", "moderate", "high").
If a value is strictly 0 or missing, do NOT invent it.
"low" risk is Green/Good. "moderate" is Orange. "high" is Red.
TRANSLATE ALL OUTPUT TO French.
Return ONLY valid JSON with this structure:
{
  "defects": [{"id": "sugar", "label": "Sucre", "sublabel": "Trop sucré", "value": 12.5, "unit": "g", "level": "high", "isGood": false}],
  "qualities": [{"id": "fiber", "label": "Fibres", "sublabel": "Excellente source", "value": 4.2, "unit": "g", "level": "low", "isGood": true}],
  "aiScore": 45,
  "aiStatus": "Mauvais",
  "aiSummary": "..."}`;

  const res = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: analysisPrompt
  });
  console.log(res.text);
}
main();
