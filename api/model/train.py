import pandas as pd
import numpy as np
from supabase import create_client
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
import os
import joblib
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # 👈 cambio aquí
)

def obtener_datos():
    # Traer todos los pagos sin límite
    pagos = supabase.table("pagos").select("*").execute().data
    
    # Paginar para traer todos
    todos_pagos = []
    offset = 0
    while True:
        lote = supabase.table("pagos").select("*").range(offset, offset + 999).execute().data
        if not lote:
            break
        todos_pagos.extend(lote)
        offset += 1000
        print(f"  Cargados {len(todos_pagos)} pagos...")
        if len(lote) < 1000:
            break

    casas = supabase.table("casas").select("*").execute().data

    df_pagos = pd.DataFrame(todos_pagos) if todos_pagos else pd.DataFrame(
        columns=["casa_id", "mes", "anio", "valor", "estado", "concepto"]
    )
    df_casas = pd.DataFrame(casas)

    return df_pagos, df_casas

def construir_features(df_pagos, df_casas):
    features = []

    for casa in df_casas.itertuples():
        pagos_casa = df_pagos[df_pagos["casa_id"] == casa.id]

        total_pagos = len(pagos_casa)

        # Contar anio+mes únicos de alícuotas
        if total_pagos > 0:
            pagos_alicuota = pagos_casa[pagos_casa["concepto"] == "Alícuota"]
            meses_pagados = len(pagos_alicuota[["anio", "mes"]].drop_duplicates())
        else:
            meses_pagados = 0

        anios_pagados = pagos_casa["anio"].nunique() if total_pagos > 0 else 0
        promedio_valor = pagos_casa["valor"].mean() if total_pagos > 0 else 0
        total_valor = pagos_casa["valor"].sum() if total_pagos > 0 else 0
        tiene_parqueadero = 1 if casa.tiene_parqueadero else 0
        pendientes = len(pagos_casa[pagos_casa["estado"] == "pendiente"]) if total_pagos > 0 else 0

        # 2015 a 2026 = 132 meses esperados
        meses_esperados = 132
        ratio_cumplimiento = meses_pagados / meses_esperados
        es_moroso = 1 if ratio_cumplimiento < 0.7 else 0

        features.append({
            "casa_id": casa.id,
            "nombre": casa.nombre,
            "propietario": casa.propietario or "Sin nombre",
            "total_pagos": total_pagos,
            "meses_pagados": meses_pagados,
            "anios_pagados": anios_pagados,
            "promedio_valor": promedio_valor,
            "total_valor": total_valor,
            "tiene_parqueadero": tiene_parqueadero,
            "pendientes": pendientes,
            "ratio_cumplimiento": ratio_cumplimiento,
            "es_moroso": es_moroso
        })

    return pd.DataFrame(features)

def entrenar_modelos(df):
    X = df[[
        "total_pagos", "meses_pagados", "anios_pagados",
        "promedio_valor", "total_valor", "tiene_parqueadero",
        "pendientes", "ratio_cumplimiento"
    ]]
    y = df["es_moroso"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    print("\n🌲 Random Forest:")
    print(classification_report(y_test, rf.predict(X_test)))

    # Logistic Regression
    lr = LogisticRegression(random_state=42)
    lr.fit(X_train, y_train)
    print("\n📈 Logistic Regression:")
    print(classification_report(y_test, lr.predict(X_test)))

    # KMeans clustering
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df["cluster"] = kmeans.fit_predict(X_scaled)

    print("\n🔍 Clusters:")
    print(df.groupby("cluster")[["ratio_cumplimiento", "total_pagos", "meses_pagados"]].mean())

    return rf, lr, kmeans, scaler, df

if __name__ == "__main__":
    print("📊 Obteniendo datos de Supabase...")
    df_pagos, df_casas = obtener_datos()
    print(f"✅ {len(df_pagos)} pagos — {len(df_casas)} casas")

    print("\n🔧 Construyendo features...")
    df_features = construir_features(df_pagos, df_casas)
    print(df_features[["nombre", "meses_pagados", "ratio_cumplimiento", "es_moroso"]].head(10))

    print("\n🤖 Entrenando modelos...")
    rf, lr, kmeans, scaler, df_resultado = entrenar_modelos(df_features)

    print("\n✅ Listo!")

    os.makedirs("model/saved", exist_ok=True)
    joblib.dump(rf, "model/saved/random_forest.pkl")
    joblib.dump(lr, "model/saved/logistic_regression.pkl")
    joblib.dump(kmeans, "model/saved/kmeans.pkl")
    joblib.dump(scaler, "model/saved/scaler.pkl")
    print("💾 Modelos guardados!")
