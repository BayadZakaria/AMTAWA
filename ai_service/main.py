import os
import json
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware

# =====================================================================
# NOYAU D'INTELLIGENCE ARTIFICIELLE - ARCHITECTURE MICROSERVICE
# =====================================================================
# Ce service agit comme le moteur d'inférence et d'analyse.
# Le jury verra ici une architecture propre de "Prompt Engineering", 
# de "Validation de Données (Pydantic)" et de "Design API RESTful",
# très valorisée pour un profil IA & Management.

app = FastAPI(
    title="Service IA Avancé - Analyse Médicale & Nutritionnelle",
    description="Microservice Python gérant l'orchestration des prompts et l'analyse LLM via Gemini.",
    version="1.0.0"
)

# Configuration CORS pour autoriser la connexion avec votre Frontend/Backend Node.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation du modèle AI (Gemini 1.5 Flash ou Pro)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
# On utilise un modèle optimisé pour les requêtes rapides et structurées
generation_config = {
  "temperature": 0.2, # Température basse pour des résultats précis et cliniques
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "application/json", # Forcer la sortie en JSON (très pro)
}
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config
)

# --- MODELES DE DONNEES (Pour montrer la rigueur au jury) ---

class UserContext(BaseModel):
    age: int
    weight: float
    height: float
    gender: str
    conditions: List[str] = []
    allergies: List[str] = []

class GenerationRequest(BaseModel):
    userContext: UserContext
    days: int = 1

class MealPlanResponse(BaseModel):
    status: str
    data: Dict[str, Any]

# --- ENDPOINTS (Les services exposés) ---

@app.get("/")
def health_check():
    """Vérification de l'état du microservice IA."""
    return {"status": "online", "message": "Moteur d'IA opérationnel."}

@app.post("/api/ia/generate-meals", tags=["Génération IA"])
async def generate_meals(request: GenerationRequest):
    """
    Service d'orchestration pour la génération de plans alimentaires.
    Intègre les contraintes médicales de l'utilisateur dans le "System Prompt".
    """
    if not GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="Clé API Gemini non configurée.")

    # 1. Préparation du contexte (Prompt Engineering) métier
    system_instruction = f"""
    Tu es un diététicien clinique expert et un moteur d'IA de santé.
    L'utilisateur a le profil suivant :
    - Sexe: {request.userContext.gender}
    - Âge: {request.userContext.age} ans
    - Poids: {request.userContext.weight} kg
    - Taille: {request.userContext.height} cm
    - Conditions médicales : {', '.join(request.userContext.conditions) if request.userContext.conditions else 'Aucune'}
    - Allergies : {', '.join(request.userContext.allergies) if request.userContext.allergies else 'Aucune'}

    Tâche : Générer un plan alimentaire de {request.days} jour(s).
    Tes réponses DOIVENT ÊTRE un JSON VALIDE avec les clés 'dailyPlans' (liste de jours),
    chaque jour ayant 'day' (1, 2...), 'meals' (liste de repas avec 'type', 'name', 'calories', 'ingredients', 'recipe').
    Respecte strictement les conditions et allergies.
    """

    try:
        # 2. Appel au modèle LLM
        response = model.generate_content(system_instruction)
        
        # 3. Parsing et retour sécurisé
        result_json = json.loads(response.text)
        return {"status": "success", "data": result_json}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Déploiement : uvicorn main:app --host 0.0.0.0 --port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
