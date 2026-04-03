import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

# Usar service role para saltarse RLS
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # 👈 cambio aquí
)

def cargar_propietarios():
    print("👤 Actualizando propietarios...")
    df = pd.read_csv("propietarios.csv")
    casas = supabase.table("casas").select("*").order("numero").execute().data

    actualizados = 0
    for _, row in df.iterrows():
        numero = int(row["casa_numero"])
        propietario = str(row["propietario"]).strip().upper()

        # Buscar casa por numero
        casa = next((c for c in casas if c["numero"] == numero), None)
        if not casa:
            print(f"  ⚠️ Casa {numero} no encontrada")
            continue

        result = supabase.table("casas").update({
            "propietario": propietario
        }).eq("id", casa["id"]).execute()

        print(f"  Casa {numero} | {propietario} | result: {result.data}")
        actualizados += 1

    print(f"\n✅ {actualizados} propietarios actualizados")

def cargar_pagos():
    print("💰 Cargando pagos históricos...")
    df = pd.read_csv("pagos_historicos.csv")
    
    # Obtener casas para hacer el match numero -> id
    casas = supabase.table("casas").select("id, numero").execute().data
    mapa_casas = {c["numero"]: c["id"] for c in casas}
    
    # Verificar pagos existentes para no duplicar
    print("  🔍 Verificando pagos existentes...")
    existentes = supabase.table("pagos").select("casa_id, mes, anio, concepto").execute().data
    existentes_set = {
        (p["casa_id"], p["mes"], p["anio"], p["concepto"])
        for p in existentes
    }
    
    print(f"  📊 {len(existentes_set)} pagos ya existentes en BD")
    
    # Insertar en lotes de 500
    lote = []
    insertados = 0
    omitidos = 0
    
    for _, row in df.iterrows():
        casa_id = mapa_casas.get(int(row["casa_numero"]))
        if not casa_id:
            continue
        
        key = (casa_id, row["mes"], int(row["anio"]), row["concepto"])
        if key in existentes_set:
            omitidos += 1
            continue
        
        lote.append({
            "casa_id": casa_id,
            "anio": int(row["anio"]),
            "mes": row["mes"],
            "concepto": row["concepto"],
            "valor": float(row["valor"]),
            "estado": row["estado"]
        })
        
        # Insertar cada 500 registros
        if len(lote) >= 500:
            supabase.table("pagos").insert(lote).execute()
            insertados += len(lote)
            print(f"  📤 {insertados} registros insertados...")
            lote = []
    
    # Insertar resto
    if lote:
        supabase.table("pagos").insert(lote).execute()
        insertados += len(lote)
    
    print(f"\n✅ Carga completa:")
    print(f"   📤 {insertados} pagos insertados")
    print(f"   ⏭️  {omitidos} omitidos (ya existían)")

if __name__ == "__main__":
    cargar_propietarios()
    # cargar_pagos()