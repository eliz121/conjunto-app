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
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def obtener_datos():
    pagos = supabase.table("pagos").select("*").execute().data
    casas = supabase.table("casas").select("*").execute().data
    return pd.DataFrame(pagos), pd.DataFrame(casas)

def construir_features(df_pagos, df_casas):
    features = []

    for casa in df_casas.itertuples():
        pagos_casa = df_pagos[df_pagos["casa_id"] == casa.id]

        # Total pagos realizados
        total_pagos = len(pagos_casa)

        # Total meses únicos pagados
        meses_pagados = pagos_casa["mes"].nunique() if total_pagos > 0 else 0

        # Años únicos con pagos
        anios_pagados = pagos_casa["anio"].nunique() if total_pagos > 0 else 0

        # Promedio de valor pagado
        promedio_valor = pagos_casa["valor"].mean() if total_pagos > 0 else 0

        # Total pagado
        total_valor = pagos_casa["valor"].sum() if total_pagos > 0 else 0

        # Tiene parqueadero
        tiene_parqueadero = 1 if casa.tiene_parqueadero else 0

        # Pagos pendientes
        pendientes = len(pagos_casa[pagos_casa["estado"] == "pendiente"]) if total_pagos > 0 else 0

        # Ratio de cumplimiento — pagados vs total esperado
        # Esperado: meses desde 2018 hasta 2026 = ~96 meses
        meses_esperados = 96
        ratio_cumplimiento = meses_pagados / meses_esperados

        # Etiqueta moroso — si tiene menos del 50% de cumplimiento
        es_moroso = 1 if ratio_cumplimiento < 0.5 else 0

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