# Moteur d'IA - NutriScan Backend

Ce dossier représente le **Microservice d'Intelligence Artificielle (Python)** de l'application. 
C'est ce code que vous présenterez à votre jury pour montrer la partie IA de votre PFE.

## Pourquoi cette architecture impressionne le jury (Génie Logiciel & Management) :
1. **Architecture Microservices** : Vous séparez l'interface web (Vercel/Node) de la logique IA (Python/Koyeb). C'est une excellente pratique industrielle.
2. **Framework FastAPI** : Très moderne, performant et massivement utilisé dans l'IA aujourd'hui en entreprise.
3. **Prompt Engineering structuré** : Le prompt injecte dynamiquement des données de santé.
4. **Typage de données (Pydantic)** : Vous forcez l'IA à répondre avec une structure JSON valide, validée par vos modèles `BaseModel`.

## Comment déployer ce dossier seul sur Koyeb :

1. **Créer un nouveau dépôt GitHub** spécifiquement pour ce dossier `ai_service`. (Appelez-le par exemple `pfe-ai-backend`).
2. Mettez les fichiers `main.py` et `requirements.txt` à la racine de ce nouveau dépôt.
3. Allez sur **Koyeb** (ou Render.com, un autre excellent choix gratuit).
4. Connectez votre GitHub et choisissez ce dépôt `pfe-ai-backend`.
5. Dans la configuration de Koyeb :
   - **Build Command** : `pip install -r requirements.txt`
   - **Run Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environnement (Variables)** : Ajoutez `GEMINI_API_KEY` = `votre_clé_api_google`
6. Déployez ! Vous obtiendrez un lien API public (ex: `https://votre-app-koyeb.app.koyeb.com`).

Ensuite, dans le code web (Vercel ou Applet), vous pourrez remplacer les appels à `/api/generate-meals` par des appels à votre vraie API Python sur Koyeb !
