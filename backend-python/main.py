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
    description="FastAPI Backend for AMTAWA integrating local AI (Ollama)"
)

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"

# Initialize Supabase
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class AnalyzeProductRequest(BaseModel):
    user_id: str
    barcode: str

@app.post("/api/analyze-product")
async def analyze_product(request: AnalyzeProductRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")

    # 1. Supabase Data Fetching
    try:
        print(f"DEBUG: Fetching user data for: {request.user_id}")
        user_response = supabase.table('medical_profiles').select('*').eq('user_id', request.user_id).execute()
        user_data = user_response.data[0] if user_response.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase Error: {str(e)}")

    # 2. OpenFoodFacts
    async with httpx.AsyncClient() as client:
        try:
            print(f"DEBUG: Fetching OFF data for: {request.barcode}")
            off_url = f"https://world.openfoodfacts.org/api/v0/product/{request.barcode}.json"
            off_response = await client.get(off_url, timeout=10.0)
            off_data = off_response.json()
            product_info = off_data.get('product', {}) if off_data.get('status') == 1 else {}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OpenFoodFacts Error: {str(e)}")

    # 3. Prompt Preparation
    allergies = ", ".join(user_data.get('allergies', [])) if user_data.get('allergies') else "لا توجد"
    product_name = product_info.get('product_name', 'غير متوفر')
    ingredients = product_info.get('ingredients_text', 'غير متوفر')
    kcal = product_info.get('nutriments', {}).get('energy-kcal_100g', 'غير متوفر')

    system_prompt = f"""
أنت خبير تغذية رياضي مغربي محترف.
بيانات المستخدم: الحساسية: {allergies}.
المنتج: {product_name}. المكونات: {ingredients}. السعرات: {kcal}.
قدم نصيحة احترافية ومباشرة بالعربية.
"""

    # 4. Ollama Call
    ollama_payload = {
        "model": "llama3",
        "messages": [{"role": "user", "content": system_prompt}],
        "stream": False
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"DEBUG: Sending request to Ollama at {OLLAMA_URL} (Waiting for AI to think...)")
            
            # timeout=None is crucial for local inference without a dedicated GPU
            ollama_response = await client.post(OLLAMA_URL, json=ollama_payload, timeout=None)
            
            if ollama_response.status_code != 200:
                print(f"CRITICAL: Ollama returned status {ollama_response.status_code}: {ollama_response.text}")
                raise HTTPException(status_code=502, detail=f"Ollama Error: {ollama_response.text}")
                
            ollama_data = ollama_response.json()
            ai_text = ollama_data.get('message', {}).get('content', 'No response')
            print("DEBUG: Ollama responded successfully!")
            
        except httpx.ConnectError as e:
            print(f"CRITICAL: Connection Error! Detail: {repr(e)}")
            raise HTTPException(status_code=502, detail=f"Could not connect to Ollama: {repr(e)}")
        except Exception as e:
            print(f"CRITICAL OLLAMA ERROR: {type(e).__name__} - {repr(e)}")
            raise HTTPException(status_code=502, detail=f"Communication failed: {type(e).__name__} - {repr(e)}")

    # 5. Response
    return {"success": True, "product_name": product_name, "analysis": ai_text}