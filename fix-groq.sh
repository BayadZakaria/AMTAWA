sed -i '/process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || '\''dummy-ollama-key'\'';/d' server.ts
