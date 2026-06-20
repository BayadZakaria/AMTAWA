import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="AMTAWA Backend API", 
    description="FastAPI Backend for AMTAWA integrating local AI (Ollama) and existing APIs"
)

# Setup CORS Middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment Variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")

# Initialize Supabase Client
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class AnalyzeProductRequest(BaseModel):
    user_id: str
    barcode: str

@app.post("/api/analyze-product")
async def analyze_product(request: AnalyzeProductRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase credentials are not configured in environment variables.")

    user_id = request.user_id
    barcode = request.barcode

    # 1. Supabase Data Fetching
    # Fetching from medical_profiles as it contains context like allergies, conditions, weight.
    try:
        user_response = supabase.table('medical_profiles').select('*').eq('user_id', user_id).execute()
        user_data = user_response.data[0] if user_response.data else {}
        
        # Optionally, you can also fetch from the 'users' table if you need email or other auth metadata
        # auth_user_response = supabase.table('users').select('*').eq('id', user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user context from Supabase: {str(e)}")

    # 2. OpenFoodFacts Integration
    async with httpx.AsyncClient() as client:
        try:
            off_url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
            off_response = await client.get(off_url)
            off_response.raise_for_status()
            off_data = off_response.json()
            
            if off_data.get('status') != 1:
                product_info = {
                    "product_name": "Unknown Product", 
                    "ingredients_text": "Not available",
                    "nutriments": {}
                }
            else:
                product_info = off_data.get('product', {})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch data from OpenFoodFacts: {str(e)}")

    # 3. PRESERVE EXISTING DATA APIs (Placeholders)
    # -------------------------------------------------------------------------
    # TODO: DO NOT REMOVE THIS SECTION
    # Integrate your existing fitness, recipes, or workout APIs here.
    # The data fetched here should be structured and passed into 'existing_apis_data'
    # so the local AI has full context of the user's external health information.
    # 
    # Example:
    # fitness_data = await fetch_fitness_api(user_id)
    # recipe_data = await fetch_recipe_api(product_info.get("product_name"))
    
    existing_apis_data = {
        "recent_workouts": "Placeholder for fitness API data",
        "current_diet_plan": "Placeholder for recipe API data",
        "daily_caloric_burn": "Placeholder for external tracking API"
    }
    # -------------------------------------------------------------------------

    # 4. Prompt Engineering (Moroccan Sports Nutritionist in Arabic)
    allergies = ", ".join(user_data.get('allergies', [])) if user_data.get('allergies') else "لا توجد"
    conditions = ", ".join(user_data.get('medical_conditions', [])) if user_data.get('medical_conditions') else "لا توجد"
    
    product_name = product_info.get('product_name', 'غير متوفر')
    ingredients = product_info.get('ingredients_text', 'غير متوفر')
    kcal = product_info.get('nutriments', {}).get('energy-kcal_100g', 'غير متوفر')

    system_prompt = f"""
أنت خبير تغذية رياضي مغربي محترف. دورك هو تقديم نصيحة غذائية دقيقة، مبنية على البيانات، ومناسبة ثقافياً (للمجتمع المغربي) واقتصادية.

بيانات المستخدم الطبية:
- الحساسية: {allergies}
- الحالات الطبية: {conditions}

بيانات المنتج (الباركود: {barcode}):
- اسم المنتج: {product_name}
- المكونات: {ingredients}
- القيم الغذائية (لكل 100غ): {kcal} سعرة حرارية

بيانات إضافية من الأنظمة الأخرى (النشاط البدني، النظام الغذائي الحالي، إلخ):
{existing_apis_data}

بناءً على هذه المعلومات، هل تنصح المستخدم باستهلاك هذا المنتج؟ 
قدم إجابتك باللغة العربية بأسلوب احترافي، مباشر، ومبني على التحليل الطبي والرياضي. يرجى الأخذ بعين الاعتبار نشاطه البدني من البيانات الإضافية.
إذا كان المنتج غير مناسب، اقترح بدائل مغربية رخيصة وصحية (مثل: الشوفان، البيض، زيت الزيتون، أملو، إلخ).
"""

    # 5. Local Custom AI (Ollama)
    ollama_payload = {
        "model": "llama3",
        "messages": [
            {
                "role": "user",
                "content": system_prompt
            }
        ],
        "stream": False
    }

    async with httpx.AsyncClient() as client:
        try:
            # We use a longer timeout because local LLM inference might take time
            ollama_response = await client.post(OLLAMA_URL, json=ollama_payload, timeout=120.0)
            ollama_response.raise_for_status()
            
            ollama_data = ollama_response.json()
            ai_generated_text = ollama_data.get('message', {}).get('content', '')
            
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to communicate with local AI (Ollama): {str(e)}")

    # 6. Response
    return {
        "success": True,
        "product_name": product_name,
        "analysis": ai_generated_text
    }

# To run the server locally:
# uvicorn main:app --reload --port 8000
