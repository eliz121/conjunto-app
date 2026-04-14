"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

const CONCEPTOS_ESPECIALES = [
  "Agua","Fachada Conjunto","Casa Comunal","Multa Asamblea",
  "Llaveros","Sillas","Intercomunicador","Puert. y Llav.",
  "Pintura","Asamblea","Cámaras","Controles Peatonales"
]

const ANIOS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function Dashboard() {
  const router = useRouter()
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [tab, setTab] = useState<"alicuotas" | "especiales">("alicuotas")
  const [casas, setCasas] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [alicuota, setAlicuota] = useState(18)
  const [parqueadero, setParqueadero] = useState(2)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCasa, setModalCasa] = useState<any>(null)
  const [modalMes, setModalMes] = useState("")
  const [modalConcepto, setModalConcepto] = useState("")
  const [modalValor, setModalValor] = useState("")
  const [modalRecibo, setModalRecibo] = useState("")
  const [modalArchivo, setModalArchivo] = useState<File | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalPagoExistente, setModalPagoExistente] = useState<any>(null)
  const [modalEstado, setModalEstado] = useState("pagado")

  // Verificar admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single()

      if (usuario?.rol !== "admin") router.push("/mis-pagos")
    }
    checkAdmin()
  }, [])

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: casasData } = await supabase
        .from("casas")
        .select("*")
        .order("numero", { ascending: true })

      const { data: pagosData } = await supabase
        .from("pagos")
        .select("*")
        .eq("anio", anio)

      const { data: config } = await supabase
        .from("configuracion")
        .select("*")

      if (config) {
        const a = config.find(c => c.clave === "alicuota")
        const p = config.find(c => c.clave === "parqueadero")
        if (a) setAlicuota(parseFloat(a.valor))
        if (p) setParqueadero(parseFloat(p.valor))
      }

      setCasas(casasData || [])
      setPagos(pagosData || [])
      setLoading(false)
    }
    fetchData()
  }, [anio])

  const getPago = (casa_id: string, mes: string, concepto: string) => {
    return pagos.find(p =>
      p.casa_id === casa_id &&
      p.mes === mes &&
      p.concepto === concepto
    )
  }

  const colorCelda = (pago: any) => {
    if (!pago) return "text-gray-300 hover:bg-blue-50 hover:text-blue-400"
    if (pago.estado === "acuerdo") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
    if (pago.estado === "exento") return "bg-gray-100 text-gray-500 hover:bg-gray-200"
    return "bg-green-100 text-green-700 hover:bg-green-200"
  }

  const iconoCelda = (pago: any) => {
    if (!pago) return "·"
    if (pago.estado === "acuerdo") return "🤝"
    if (pago.estado === "exento") return "⚪"
    return "●"
  }

  const abrirModal = (casa: any, mes: string, concepto: string) => {
    const pagoExistente = getPago(casa.id, mes, concepto)
    setModalCasa(casa)
    setModalMes(mes)
    setModalConcepto(concepto)
    setModalValor(
      pagoExistente?.valor?.toString() ||
      (concepto === "Alícuota" ? alicuota.toString() :
      concepto === "Parqueadero" ? parqueadero.toString() :
      concepto === "Parqueadero 2" ? parqueadero.toString() : "")
    )
    setModalRecibo(pagoExistente?.numero_recibo || "")
    setModalArchivo(null)
    setModalPagoExistente(pagoExistente || null)
    setModalEstado(pagoExistente?.estado || "pagado")
    setModalOpen(true)
  }

  const guardarPago = async () => {
    if (!modalValor || !modalRecibo) {
      alert("Completa valor y número de recibo")
      return
    }

    setModalLoading(true)

    let archivoUrl = modalPagoExistente?.archivo_url || ""

    if (modalArchivo) {
      const ext = modalArchivo.name.split(".").pop()
      const nombre = `${modalCasa.id}_${modalMes}_${modalConcepto}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("comprobantes")
        .upload(nombre, modalArchivo, { upsert: false })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("comprobantes")
          .getPublicUrl(nombre)
        archivoUrl = urlData.publicUrl
      }
    }

    if (modalPagoExistente) {
      await supabase.from("pagos").update({
        valor: parseFloat(modalValor),
        numero_recibo: modalRecibo,
        archivo_url: archivoUrl,
        estado: modalEstado
      }).eq("id", modalPagoExistente.id)
    } else {
      await supabase.from("pagos").insert({
        casa_id: modalCasa.id,
        mes: modalMes,
        anio,
        concepto: modalConcepto,
        valor: parseFloat(modalValor),
        numero_recibo: modalRecibo,
        archivo_url: archivoUrl,
        estado: modalEstado
      })
    }

    const { data: pagosData } = await supabase
      .from("pagos").select("*").eq("anio", anio)
    setPagos(pagosData || [])

    setModalLoading(false)
    setModalOpen(false)
  }

  const totalMensualCasa = (casa_id: string) => {
    return pagos
      .filter(p => p.casa_id === casa_id && (p.concepto === "Alícuota" || p.concepto === "Parqueadero"))
      .reduce((acc, p) => acc + parseFloat(p.valor || 0), 0)
  }

  const totalEspecialCasa = (casa_id: string) => {
    return pagos
      .filter(p => p.casa_id === casa_id && CONCEPTOS_ESPECIALES.includes(p.concepto))
      .reduce((acc, p) => acc + parseFloat(p.valor || 0), 0)
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Administración</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/casas")}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            🏠 Gestionar Casas
          </button>
          <button onClick={() => router.push("/egresos")}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            💸 Egresos
          </button>
          <button onClick={() => router.push("/documentos")}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            📢 Cartelera
          </button>
          <button onClick={() => router.push("/admin/configuracion")}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            ⚙️ Configuración
          </button>
          <button onClick={() => router.push("/liquidacion")}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">
            📋 Liquidación
          </button>
          <button onClick={() => router.push("/prediccion")}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            🤖 Predicción
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login") }}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 text-sm text-gray-600">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-600">Año:</label>
        <select
          value={anio}
          onChange={(e) => setAnio(parseInt(e.target.value))}
          className="border border-gray-200 px-4 py-2 rounded-lg text-gray-700 
            font-medium focus:outline-none focus:ring-2 focus:ring-black bg-white"
        >
          {ANIOS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("alicuotas")}
          className={`px-6 py-3 font-medium transition-colors
            ${tab === "alicuotas"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          Alícuotas y Parqueaderos
        </button>
        <button
          onClick={() => setTab("especiales")}
          className={`px-6 py-3 font-medium transition-colors
            ${tab === "especiales"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          Conceptos Especiales
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-300 inline-block"/> Pagado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block"/> Acuerdo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"/> Exento (Directiva)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-white border border-gray-200 inline-block"/> Sin pago
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          {/* TABLA 1 — Alícuotas */}
          {tab === "alicuotas" && (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left sticky left-0 bg-gray-100 z-10">Casa</th>
                    <th className="border border-gray-200 px-3 py-2 text-left sticky left-20 bg-gray-100 z-10">Propietario</th>
                    {MESES.map(m => (
                      <th key={m} className="border border-gray-200 px-3 py-2 whitespace-nowrap font-medium">
                        {m.slice(0, 3)}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-3 py-2 font-medium">Parq.</th>
                    <th className="border border-gray-200 px-3 py-2 font-medium">Parq. 2</th>
                    <th className="border border-gray-200 px-3 py-2 bg-yellow-50 font-medium">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {casas.map(casa => (
                    <tr key={casa.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-1 sticky left-0 bg-white font-medium text-gray-800">{casa.nombre}</td>
                      <td className="border border-gray-200 px-3 py-1 sticky left-20 bg-white whitespace-nowrap text-gray-600">{casa.propietario || "—"}</td>
                      {MESES.map(mes => {
                        const pago = getPago(casa.id, mes, "Alícuota")
                        return (
                          <td
                            key={mes}
                            onClick={() => abrirModal(casa, mes, "Alícuota")}
                            className={`border border-gray-200 px-2 py-1 text-center cursor-pointer transition-colors ${colorCelda(pago)}`}
                          >
                            {iconoCelda(pago)}
                          </td>
                        )
                      })}
                      {casa.tiene_parqueadero ? (
                        <td
                          onClick={() => abrirModal(casa, `${anio}`, "Parqueadero")}
                          className={`border border-gray-200 px-2 py-1 text-center cursor-pointer transition-colors
                            ${colorCelda(getPago(casa.id, `${anio}`, "Parqueadero"))}`}
                        >
                          {iconoCelda(getPago(casa.id, `${anio}`, "Parqueadero"))}
                        </td>
                      ) : (
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-200">—</td>
                      )}
                      {casa.tiene_parqueadero2 ? (
                        <td
                          onClick={() => abrirModal(casa, `${anio}`, "Parqueadero 2")}
                          className={`border border-gray-200 px-2 py-1 text-center cursor-pointer transition-colors
                            ${colorCelda(getPago(casa.id, `${anio}`, "Parqueadero 2"))}`}
                        >
                          {iconoCelda(getPago(casa.id, `${anio}`, "Parqueadero 2"))}
                        </td>
                      ) : (
                        <td className="border border-gray-200 px-2 py-1 text-center text-gray-200">—</td>
                      )}
                      <td className="border border-gray-200 px-3 py-1 text-right font-medium bg-yellow-50 text-gray-800">
                        ${totalMensualCasa(casa.id).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA 2 — Conceptos especiales */}
          {tab === "especiales" && (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-3 py-2 text-left sticky left-0 bg-gray-100 z-10">Casa</th>
                    <th className="border border-gray-200 px-3 py-2 text-left sticky left-20 bg-gray-100 z-10">Propietario</th>
                    {CONCEPTOS_ESPECIALES.map(c => (
                      <th key={c} className="border border-gray-200 px-3 py-2 whitespace-nowrap text-xs font-medium">{c}</th>
                    ))}
                    <th className="border border-gray-200 px-3 py-2 bg-yellow-50 font-medium">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {casas.map(casa => (
                    <tr key={casa.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-1 sticky left-0 bg-white font-medium text-gray-800">{casa.nombre}</td>
                      <td className="border border-gray-200 px-3 py-1 sticky left-20 bg-white whitespace-nowrap text-gray-600">{casa.propietario || "—"}</td>
                      {CONCEPTOS_ESPECIALES.map(concepto => {
                        const pago = getPago(casa.id, `${anio}`, concepto)
                        return (
                          <td
                            key={concepto}
                            onClick={() => abrirModal(casa, `${anio}`, concepto)}
                            className={`border border-gray-200 px-2 py-1 text-center cursor-pointer transition-colors ${colorCelda(pago)}`}
                          >
                            {pago ? `$${pago.valor}` : "—"}
                          </td>
                        )
                      })}
                      <td className="border border-gray-200 px-3 py-1 text-right font-medium bg-yellow-50 text-gray-800">
                        ${totalEspecialCasa(casa.id).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              {modalCasa?.nombre} — {modalConcepto} {modalMes}
            </h2>

            {modalPagoExistente && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✅ Pago registrado. Puedes editarlo.
              </div>
            )}

            <input
              placeholder="Valor"
              value={modalValor}
              onChange={(e) => setModalValor(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <input
              placeholder="Número de recibo"
              value={modalRecibo}
              onChange={(e) => setModalRecibo(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            />

            {/* Estado del pago */}
            <select
              value={modalEstado}
              onChange={(e) => setModalEstado(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="pagado">✅ Pagado</option>
              <option value="acuerdo">🤝 Acuerdo de pago</option>
              <option value="exento">⚪ Exento (Directiva)</option>
            </select>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">Comprobante (opcional)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setModalArchivo(e.target.files?.[0] || null)}
                className="border border-gray-200 p-2 rounded-lg text-sm text-gray-700"
              />
              {modalPagoExistente?.archivo_url && (
                <a
                  href={modalPagoExistente.archivo_url}
                  target="_blank"
                  className="text-blue-600 text-xs underline mt-1"
                >
                  Ver comprobante actual →
                </a>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              {modalPagoExistente && (
                <button
                  onClick={async () => {
                    if (!confirm("¿Eliminar este pago?")) return
                    await supabase.from("pagos").delete().eq("id", modalPagoExistente.id)
                    const { data: pagosData } = await supabase
                      .from("pagos").select("*").eq("anio", anio)
                    setPagos(pagosData || [])
                    setModalOpen(false)
                  }}
                  className="flex-1 border border-red-200 p-3 rounded-lg text-red-500 hover:bg-red-50"
                >
                  🗑️ Eliminar
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-gray-200 p-3 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPago}
                disabled={modalLoading}
                className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {modalLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}