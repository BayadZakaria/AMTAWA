import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AMTAWA Backend API", 
    description="Backend optimisé pour l'analyse locale via Ollama"
)

# Paramètres CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://amtawa-v2.vercel.app"], # Autoriser le frontend Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurations
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL")

# Initialisation de Supabase
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Modèle de requête pour l'analyse
class AnalyzeProductRequest(BaseModel):
    user_id: str
    barcode: str
    language: str = "Arabic"

# Les autres modèles de requêtes
class ScanImageRequest(BaseModel):
    image_base64: str

class AddProductRequest(BaseModel):
    barcode: str
    product_name: str
    ingredients: str
    image_base64: str = ""

class ProductReviewRequest(BaseModel):
    barcode: str
    user_name: str
    text: str
    rating: int
    language: str = "en"

@app.post("/analyze-product")
async def analyze_product(request: AnalyzeProductRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")

    # 1. Récupération des données depuis Supabase
    try:
        user_response = supabase.table('medical_profiles').select('*').eq('user_id', request.user_id).execute()
        user_data = user_response.data[0] if user_response.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase Error: {str(e)}")

    # 2. Récupération des données du produit depuis OpenFoodFacts
    async with httpx.AsyncClient() as client:
        off_url = f"https://world.openfoodfacts.org/api/v0/product/{request.barcode}.json"
        off_response = await client.get(off_url, timeout=10.0)
        off_data = off_response.json()
        product_info = off_data.get('product', {}) if off_data.get('status') == 1 else {}

    # Extract Data for Prompt & Frontend
    allergies_list = user_data.get('allergies', [])
    allergies_str = ", ".join(allergies_list) if allergies_list else "None"
    
    product_name = product_info.get('product_name', 'Unknown')
    ingredients = product_info.get('ingredients_text', 'Unknown')
    kcal = product_info.get('nutriments', {}).get('energy-kcal_100g', 'Unknown')
    nutriscore = product_info.get('nutriscore_grade', 'unknown').upper()
    allergens = product_info.get('allergens', '')
    
    # 3. Vérification de sécurité (Recherche d'allergènes)
    detected_warnings = []
    ingredients_lower = ingredients.lower()
    allergens_lower = allergens.lower()
    for allergy in allergies_list:
        if allergy.lower() in ingredients_lower or allergy.lower() in allergens_lower:
            detected_warnings.append(f"Allergène détécté: {allergy}")

    is_safe = len(detected_warnings) == 0

    # 4. Préparation du prompt pour le modèle IA
    system_prompt = (
        f"You are a Moroccan nutrition expert. "
        f"User allergies: {allergies_str}. "
        f"Product: {product_name}. "
        f"Ingredients: {ingredients}. "
        f"Calories per 100g: {kcal}. "
        f"Provide professional nutrition advice based on this profile. "
        f"CRITICAL INSTRUCTION: You MUST write your entire response ONLY in {request.language}."
    )

    # 5. Appel au modèle Ollama
    ollama_payload = {"model": "llama3", "messages": [{"role": "user", "content": system_prompt}], "stream": False}
    
    host_header = OLLAMA_URL.replace("https://", "").replace("http://", "").split("/")[0] if OLLAMA_URL else ""
    headers = {
        "Host": host_header,
        "ngrok-skip-browser-warning": "true"
    }

    async with httpx.AsyncClient() as client:
        try:
            ollama_response = await client.post(
                OLLAMA_URL, 
                json=ollama_payload, 
                headers=headers,
                timeout=None
            )
            
            if ollama_response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Ollama Error: {ollama_response.text}")
                
            ai_text = ollama_response.json().get('message', {}).get('content', 'No response')
            
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Communication failed: {str(e)}")

    # 6. Retourner la structure EXACTE attendue par React (Scanner.tsx)
    return {
        "success": True, 
        "barcode": request.barcode,
        "productName": product_name,
        "ingredients": ingredients,
        "allergens": allergens,
        "nutriscore": nutriscore,
        "isSafeForUser": is_safe,
        "warnings": detected_warnings,
        "analysis": ai_text
    }

# Endpoint pour scanner le code-barres depuis une image
@app.post("/scan-barcode-image")
async def scan_barcode_image(request: ScanImageRequest):
    # Logique pour scanner l'image (OCR ou API de vision locale).
    # Pour l'instant, on retourne un faux résultat pour valider l'intégration.
    return {"barcode": "3017620422003"} 

# Endpoint pour ajouter un produit personnalisé
@app.post("/add-custom-product")
async def add_custom_product(request: AddProductRequest):
    # Logique pour sauvegarder le produit dans Supabase
    return {"success": True}

# Endpoint pour ajouter et analyser les avis
@app.post("/product-review")
async def product_review(request: ProductReviewRequest):
    # Logique pour sauvegarder l'avis dans Supabase 
    # et préparer un consensus généré par IA
    return {
        "success": True, 
        "reviews": [{
            "id": 1,
            "user": request.user_name,
            "text": request.text,
            "rating": request.rating,
            "date": "Aujourd'hui"
        }], 
        "consensus": {
            "status": "Recommended", 
            "summary": "Consensus de la communauté basé sur l'impact sur la santé."
        }
    }

@app.get("/")
async def root():
    return {"message": "AMTAWA Backend is running"}