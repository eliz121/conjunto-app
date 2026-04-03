"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default function Egresos() {
  const router = useRouter()
  const [egresos, setEgresos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Filtros
  const [filtroMes, setFiltroMes] = useState(
    MESES[new Date().getMonth()]
  )
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear())

  // Form
  const [concepto, setConcepto] = useState("")
  const [beneficiario, setBeneficiario] = useState("")
  const [ci, setCi] = useState("")
  const [numeroRecibo, setNumeroRecibo] = useState("")
  const [fechaPago, setFechaPago] = useState("")
  const [valor, setValor] = useState("")

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
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single()

      if (usuario?.rol !== "admin") router.push("/mis-pagos")
    }
    checkAdmin()
  }, [])

  // Cargar egresos
  const fetchEgresos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("egresos")
      .select("*")
      .eq("mes", filtroMes)
      .eq("anio", filtroAnio)
      .order("fecha_pago", { ascending: true })

    setEgresos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEgresos() }, [filtroMes, filtroAnio])

  const handleGuardar = async () => {
    if (!concepto || !valor || !fechaPago) {
      mostrarMensaje("Concepto, valor y fecha son obligatorios", "error")
      return
    }

    const valorNumero = parseFloat(valor.replace(",", "."))
    if (isNaN(valorNumero)) {
      mostrarMensaje("Valor inválido", "error")
      return
    }

    setGuardando(true)

    const { error } = await supabase.from("egresos").insert({
      mes: filtroMes,
      anio: filtroAnio,
      concepto,
      beneficiario,
      ci,
      numero_recibo: numeroRecibo,
      fecha_pago: fechaPago,
      valor: valorNumero
    })

    setGuardando(false)

    if (error) {
      mostrarMensaje("Error al guardar", "error")
      return
    }

    mostrarMensaje("Egreso guardado ✅", "success")
    setConcepto("")
    setBeneficiario("")
    setCi("")
    setNumeroRecibo("")
    setFechaPago("")
    setValor("")
    fetchEgresos()
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este egreso?")) return

    await supabase.from("egresos").delete().eq("id", id)
    fetchEgresos()
  }

  const totalEgresos = egresos.reduce((acc, e) => acc + parseFloat(e.valor || 0), 0)

  return (
    <div className="p-6">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white z-50
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Egresos</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          ← Volver al Dashboard
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

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="border border-gray-200 px-3 py-2 rounded-lg text-gray-700 focus:outline-none"
        >
          {MESES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={filtroAnio}
          onChange={(e) => setFiltroAnio(parseInt(e.target.value))}
          className="border border-gray-200 px-3 py-2 rounded-lg text-gray-700 focus:outline-none"
        >
          {[2022,2023,2024,2025,2026].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-8">

        {/* Formulario */}
        <div className="w-96 flex-shrink-0">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Registrar Egreso</h2>
          <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">

            <textarea
              placeholder="Concepto (descripción del pago) *"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              rows={3}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-black resize-none bg-white"
            />

            <input
              placeholder="Beneficiario"
              value={beneficiario}
              onChange={(e) => setBeneficiario(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />

            <input
              placeholder="CI del beneficiario"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />

            <input
              placeholder="Número de recibo"
              value={numeroRecibo}
              onChange={(e) => setNumeroRecibo(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Fecha de pago *</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                  focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
            </div>

            <input
              placeholder="Valor *"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />

            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="bg-black text-white p-3 rounded-lg hover:bg-gray-800 
                disabled:opacity-50 font-medium mt-1"
            >
              {guardando ? "Guardando..." : "Guardar Egreso"}
            </button>
          </div>
        </div>

        {/* Lista de egresos */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Egresos — {filtroMes} {filtroAnio}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              Total: <span className="text-red-600 font-bold">${totalEgresos.toFixed(2)}</span>
            </span>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : egresos.length === 0 ? (
            <div className="text-center py-12 text-gray-300">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">No hay egresos registrados para este mes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {egresos.map((egreso, i) => (
                <div key={egreso.id}
                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">#{i + 1}</span>
                        {egreso.numero_recibo && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            Recibo {egreso.numero_recibo}
                          </span>
                        )}
                        {egreso.fecha_pago && (
                          <span className="text-xs text-gray-400">
                            {new Date(egreso.fecha_pago).toLocaleDateString("es-EC")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{egreso.concepto}</p>
                      {egreso.beneficiario && (
                        <p className="text-xs text-gray-400">
                          {egreso.beneficiario}
                          {egreso.ci && ` — CI: ${egreso.ci}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500">${parseFloat(egreso.valor).toFixed(2)}</span>
                      <button
                        onClick={() => handleEliminar(egreso.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}