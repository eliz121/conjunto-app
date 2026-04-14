from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import joblib
import numpy as np
import pandas as pd
from supabase import create_client

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Cargar modelos
rf = joblib.load("model/saved/random_forest.pkl")
lr = joblib.load("model/saved/logistic_regression.pkl")
kmeans = joblib.load("model/saved/kmeans.pkl")
scaler = joblib.load("model/saved/scaler.pkl")

def obtener_features():
    todos_pagos = []
    offset = 0
    while True:
        lote = supabase.table("pagos").select("*").range(offset, offset + 999).execute().data
        if not lote:
            break
        todos_pagos.extend(lote)
        offset += 1000
        if len(lote) < 1000:
            break

    casas = supabase.table("casas").select("*").execute().data
    df_pagos = pd.DataFrame(todos_pagos) if todos_pagos else pd.DataFrame(
        columns=["casa_id", "mes", "anio", "valor", "estado", "concepto"]
    )
    df_casas = pd.DataFrame(casas)

    features = []
    for casa in df_casas.itertuples():
        pagos_casa = df_pagos[df_pagos["casa_id"] == casa.id]
        total_pagos = len(pagos_casa)

        if total_pagos > 0:
            pagos_alicuota = pagos_casa[pagos_casa["concepto"] == "Alícuota"]
            meses_pagados = len(pagos_alicuota[["anio", "mes"]].drop_duplicates())
        else:
            meses_pagados = 0

        anios_pagados = pagos_casa["anio"].nunique() if total_pagos > 0 else 0
        promedio_valor = float(pagos_casa["valor"].mean()) if total_pagos > 0 else 0
        total_valor = float(pagos_casa["valor"].sum()) if total_pagos > 0 else 0
        tiene_parqueadero = 1 if casa.tiene_parqueadero else 0
        pendientes = len(pagos_casa[pagos_casa["estado"] == "pendiente"]) if total_pagos > 0 else 0
        meses_esperados = 132
        ratio_cumplimiento = meses_pagados / meses_esperados

        features.append({
            "casa_id": casa.id,
            "nombre": casa.nombre,
            "propietario": getattr(casa, "propietario", None) or "Sin nombre",
            "total_pagos": total_pagos,
            "meses_pagados": meses_pagados,
            "anios_pagados": anios_pagados,
            "promedio_valor": promedio_valor,
            "total_valor": total_valor,
            "tiene_parqueadero": tiene_parqueadero,
            "pendientes": pendientes,
            "ratio_cumplimiento": ratio_cumplimiento,
        })

    return pd.DataFrame(features)

@app.get("/")
def root():
    return {"mensaje": "API de predicción corriendo ✅"}

@app.get("/prediccion")
def prediccion():
    df = obtener_features()

    X = df[[
        "total_pagos", "meses_pagados", "anios_pagados",
        "promedio_valor", "total_valor", "tiene_parqueadero",
        "pendientes", "ratio_cumplimiento"
    ]]
    X_scaled = scaler.transform(X)

    probabilidades = rf.predict_proba(X_scaled)[:, 1]
    predicciones = rf.predict(X_scaled)
    clusters = kmeans.predict(X_scaled)

    etiquetas_cluster = {0: "Buen pagador", 1: "Moroso crónico", 2: "Irregular"}

    resultado = []
    for i, row in df.iterrows():
        resultado.append({
            "casa": row["nombre"],
            "propietario": row["propietario"],
            "meses_pagados": int(row["meses_pagados"]),
            "ratio_cumplimiento": round(float(row["ratio_cumplimiento"]) * 100, 1),
            "probabilidad_mora": round(float(probabilidades[i]) * 100, 1),
            "es_moroso": bool(predicciones[i]),
            "cluster": int(clusters[i]),
            "perfil": etiquetas_cluster.get(int(clusters[i]), "Desconocido")
        })

    resultado.sort(key=lambda x: x["probabilidad_mora"], reverse=True)
    return resultado

@app.get("/clusters")
def clusters():
    df = obtener_features()

    X = df[[
        "total_pagos", "meses_pagados", "anios_pagados",
        "promedio_valor", "total_valor", "tiene_parqueadero",
        "pendientes", "ratio_cumplimiento"
    ]]
    X_scaled = scaler.transform(X)
    clusters_pred = kmeans.predict(X_scaled)

    etiquetas = {0: "Buen pagador", 1: "Moroso crónico", 2: "Irregular"}
    resumen = {0: [], 1: [], 2: []}

    for i, row in df.iterrows():
        cluster = int(clusters_pred[i])
        resumen[cluster].append(row["nombre"])

    return [
        {
            "cluster": k,
            "perfil": etiquetas[k],
            "total_casas": len(v),
            "casas": v
        }
        for k, v in resumen.items()
    ]

@app.post("/reentrenar")
def reentrenar():
    try:
        import subprocess
        subprocess.run(["python", "model/train.py"], check=True)
        
        # Recargar modelos
        global rf, lr, kmeans, scaler
        rf = joblib.load("model/saved/random_forest.pkl")
        lr = joblib.load("model/saved/logistic_regression.pkl")
        kmeans = joblib.load("model/saved/kmeans.pkl")
        scaler = joblib.load("model/saved/scaler.pkl")
        
        return {"mensaje": "Modelo reentrenado ✅"}
    except Exception as e:
        return {"error": str(e)}