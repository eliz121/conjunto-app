"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Sidebar from "../components/Sidebar"


const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default function Liquidacion() {
  const router = useRouter()
  const [mes, setMes] = useState(MESES[new Date().getMonth()])
  const [anio, setAnio] = useState(new Date().getFullYear())

  const [liquidacion, setLiquidacion] = useState<any>(null)
  const [egresos, setEgresos] = useState<any[]>([])
  const [totalIngresosMes, setTotalIngresosMes] = useState(0)
  const [saldoAnterior, setSaldoAnterior] = useState(0)
  const [saldoManual, setSaldoManual] = useState(false)
  const [saldoInput, setSaldoInput] = useState("0")
  const [publicando, setPublicando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<"success" | "error" | "">("")

  const mostrarMensaje = (msg: string, tipoMsg: "success" | "error") => {
    setMensaje(msg)
    setTipo(tipoMsg)
    setTimeout(() => { setMensaje(""); setTipo("") }, 3000)
  }

  // Verificar admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      const { data: usuario } = await supabase
        .from("usuarios").select("rol").eq("id", user.id).single()
      if (usuario?.rol !== "admin") router.push("/mis-pagos")
    }
    checkAdmin()
  }, [])

  // Cargar datos del mes seleccionado
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // 1️⃣ Liquidación existente de este mes
      const { data: liqExistente } = await supabase
        .from("liquidaciones")
        .select("*")
        .eq("mes", mes)
        .eq("anio", anio)
        .single()

      setLiquidacion(liqExistente || null)

      // 2️⃣ Saldo anterior — buscar liquidación del mes previo
      const indiceMes = MESES.indexOf(mes)
      const mesPrevio = indiceMes === 0 ? "Diciembre" : MESES[indiceMes - 1]
      const anioPrevio = indiceMes === 0 ? anio - 1 : anio

      const { data: liqPrevia } = await supabase
        .from("liquidaciones")
        .select("saldo_actual")
        .eq("mes", mesPrevio)
        .eq("anio", anioPrevio)
        .single()

      if (liqPrevia) {
        setSaldoAnterior(liqPrevia.saldo_actual)
        setSaldoManual(false)
      } else {
        // No hay mes previo — modo manual
        setSaldoAnterior(liqExistente?.saldo_anterior || 0)
        setSaldoInput(liqExistente?.saldo_anterior?.toString() || "0")
        setSaldoManual(true)
      }

      // 3️⃣ Egresos del mes
      const { data: egresosData } = await supabase
        .from("egresos")
        .select("*")
        .eq("mes", mes)
        .eq("anio", anio)
        .order("fecha_pago", { ascending: true })

      setEgresos(egresosData || [])

      // 4️⃣ Ingresos del mes (pagos)
      const { data: pagosData } = await supabase
        .from("pagos")
        .select("valor")
        .eq("mes", mes)
        .eq("anio", anio)

      const totalPagos = (pagosData || []).reduce((acc, p) => acc + parseFloat(p.valor || 0), 0)
      setTotalIngresosMes(totalPagos)

      setLoading(false)
    }

    fetchData()
  }, [mes, anio])

  // Cálculos
  const saldoBase = saldoManual ? parseFloat(saldoInput || "0") : saldoAnterior
  const totalIngresos = saldoBase + totalIngresosMes
  const totalEgresos = egresos.reduce((acc, e) => acc + parseFloat(e.valor || 0), 0)
  const saldoActual = totalIngresos - totalEgresos

  const handleGuardar = async () => {
    setGuardando(true)

    const payload = {
      mes,
      anio,
      saldo_anterior: saldoBase,
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      saldo_actual: saldoActual,
      publicada: liquidacion?.publicada || false
    }

    if (liquidacion) {
      await supabase.from("liquidaciones").update(payload).eq("id", liquidacion.id)
    } else {
      await supabase.from("liquidaciones").insert(payload)
    }

    setGuardando(false)
    mostrarMensaje("Liquidación guardada ✅", "success")

    // Refrescar
    const { data } = await supabase
      .from("liquidaciones").select("*").eq("mes", mes).eq("anio", anio).single()
    setLiquidacion(data)
  }

  const handlePublicar = async () => {
    if (!liquidacion) {
      mostrarMensaje("Guarda primero la liquidación", "error")
      return
    }

    setPublicando(true)
    const nuevoEstado = !liquidacion.publicada

    await supabase
      .from("liquidaciones")
      .update({ publicada: nuevoEstado })
      .eq("id", liquidacion.id)

    setLiquidacion({ ...liquidacion, publicada: nuevoEstado })
    setPublicando(false)
    mostrarMensaje(nuevoEstado ? "Liquidación publicada ✅" : "Liquidación despublicada", "success")
  }

  return (
    <div className="p-6 max-w-4xl">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white z-50
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Liquidación</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/egresos")}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
          >
            ➕ Registrar Egreso
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
          >
            ← Dashboard
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push("/login")
            }}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-gray-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Selector mes/año */}
      <div className="flex gap-3 mb-8">
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="border border-gray-200 px-3 py-2 rounded-lg text-gray-700 focus:outline-none"
        >
          {MESES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select
          value={anio}
          onChange={(e) => setAnio(parseInt(e.target.value))}
          className="border border-gray-200 px-3 py-2 rounded-lg text-gray-700 focus:outline-none"
        >
          {[2022,2023,2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {liquidacion?.publicada && (
          <span className="bg-green-100 text-green-700 text-sm px-3 py-2 rounded-lg font-medium">
            ✅ Publicada
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Liquidación correspondiente al mes de {mes} {anio}
            </h2>

            {/* INGRESOS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Ingresos
              </h3>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    Saldo según liquidación de {
                      MESES.indexOf(mes) === 0
                        ? `Diciembre ${anio - 1}`
                        : `${MESES[MESES.indexOf(mes) - 1]} ${anio}`
                    }
                  </span>
                  {saldoManual ? (
                    <input
                      value={saldoInput}
                      onChange={(e) => setSaldoInput(e.target.value)}
                      className="border border-gray-200 px-2 py-1 rounded text-right text-sm w-32
                        focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  ) : (
                    <span className="font-medium text-gray-800">
                      ${saldoAnterior.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    Ingresos por pagos de {mes} {anio}
                  </span>
                  <span className="font-medium text-gray-800">${totalIngresosMes.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-2 font-semibold">
                  <span className="text-gray-800">Total ingresos {mes} {anio}</span>
                  <span className="text-gray-800">${totalIngresos.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* EGRESOS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Egresos
              </h3>

              {egresos.length === 0 ? (
                <p className="text-sm text-gray-300 py-2">No hay egresos registrados para este mes</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {egresos.map((egreso, i) => (
                    <div key={egreso.id}
                      className="flex justify-between items-start py-2 border-b border-gray-100 gap-4">
                      <span className="text-sm text-gray-600 flex-1">
                        {egreso.concepto}
                        {egreso.beneficiario && (
                          <span className="text-gray-400">
                            {" "}— {egreso.beneficiario}
                            {egreso.ci && ` CI: ${egreso.ci}`}
                            {egreso.numero_recibo && `, recibo # ${egreso.numero_recibo}`}
                            {egreso.fecha_pago && `, ${new Date(egreso.fecha_pago).toLocaleDateString("es-EC")}`}
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-red-500 whitespace-nowrap">
                        ${parseFloat(egreso.valor).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center py-2 font-semibold">
                    <span className="text-gray-800">Total egresos {mes} {anio}</span>
                    <span className="text-red-500">${totalEgresos.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BALANCE */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Balance General
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ingresos</span>
                  <span className="font-medium text-gray-800">${totalIngresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Egresos</span>
                  <span className="font-medium text-red-500">${totalEgresos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-1">
                  <span>Saldo actual</span>
                  <span className={saldoActual >= 0 ? "text-green-600" : "text-red-600"}>
                    ${saldoActual.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
            >
              {guardando ? "Guardando..." : "💾 Guardar Liquidación"}
            </button>

            <button
              onClick={handlePublicar}
              disabled={publicando}
              className={`px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors
                ${liquidacion?.publicada
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {publicando ? "..." : liquidacion?.publicada ? "✅ Publicada — Despublicar" : "📢 Publicar"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}