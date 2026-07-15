# 🧬 AMTAWA - Intelligent E-Health & Nutrition Platform

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)
![LLM](https://img.shields.io/badge/AI-Local_Llama_3-0466C8?logo=meta&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-008CDD?logo=stripe&logoColor=white)

## 📌 Overview

**AMTAWA** is a sovereign, privacy-first e-health platform designed to democratize personalized medical and nutritional coaching. 

Unlike traditional cloud-based health apps, AMTAWA relies on a **100% Local Large Language Model (Local LLM)** via Ollama. This ensures that no sensitive biometric or medical data ever leaves the user's secure ecosystem. The platform also strictly enforces an algorithmically optimized daily budget (e.g., 50 MAD) to make healthy living accessible in emerging markets.

## ✨ Key Features

- 🛡️ **Privacy-by-Design (Local AI):** Uses an on-premise Llama 3 model to process medical queries. Zero data leakage to third-party APIs.
- 📱 **NutriScan:** Barcode scanning system that instantly validates food compatibility based on the user's specific medical profile and allergies.
- 🥗 **Budget-Constrained Meal Planner:** Generates daily nutritional plans while substituting expensive ingredients with affordable, local alternatives.
- 🏋️ **Adaptive Fitness Coaching:** Creates workout routines tailored to physical limitations and specific goals (weight loss, muscle gain, maintenance).
- 💳 **Token Store (Pay-As-You-Go):** Integrated Stripe payment gateway for seamless AI token recharging.

## 🏗️ Architecture ("Fortress" Pattern)

The system is built on a decoupled "Fortress" architecture:
- **Frontend (React.js):** A lightweight, passive Progressive Web App (PWA) with zero exposed business logic.
- **Backend (Python / FastAPI):** Acts as the orchestrator and API Gateway, handling prompt engineering and data validation (Pydantic).
- **AI Engine (Ollama / Llama 3):** Isolated AI inference engine communicating only with the backend.
- **Database (Supabase):** Implements **Row Level Security (RLS)** to strictly isolate clinical data.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- [Ollama](https://ollama.ai/) installed with the `llama3` model (`ollama pull llama3`)
- Supabase and Stripe API keys

### ⚙️ Installation

**1. Clone the repository**
```bash
git clone [https://github.com/YOUR-USERNAME/amtawa.git](https://github.com/YOUR-USERNAME/amtawa.git)
cd amtawa
2. Setup the Backend (FastAPI)

Bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend/ directory:

Extrait de code
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OLLAMA_HOST=http://localhost:11434
STRIPE_SECRET_KEY=your_stripe_key
Run the backend:

Bash
uvicorn main:app --reload --port 8000
3. Setup the Frontend (React.js)

Bash
cd ../frontend
npm install
npm run dev
🔒 Security
Data Sovereignty: Compliant with strict data protection guidelines (e.g., CNDP Law 09-08).

PCI-DSS: No credit card data is stored on our servers; all transactions are securely offloaded to Stripe.

👨‍💻 Author
Zakaria BAYAD

Etudient : SupRH
Project Type: End of Studies Project (MVP)

Built with passion and local intelligence.
