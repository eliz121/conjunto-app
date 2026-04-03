from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

app = FastAPI()

# CORS para que Next.js pueda consumir la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.get("/")
def root():
    return {"mensaje": "API de predicción corriendo ✅"}

@app.get("/datos")
def obtener_datos():
    # Traer pagos
    pagos = supabase.table("pagos").select("*").execute()
    # Traer casas
    casas = supabase.table("casas").select("*").execute()
    
    return {
        "pagos": len(pagos.data),
        "casas": len(casas.data)
    }