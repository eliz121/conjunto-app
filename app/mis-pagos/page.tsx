"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default function MisPagos() {
  const router = useRouter()
  const [pagos, setPagos] = useState<any[]>([])
  const [casa, setCasa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"pagados" | "pendientes">("pagados")
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      // Obtener casa del vecino
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("casa_id, rol")
        .eq("id", user.id)
        .single()

      if (!usuario) { router.push("/login"); return }
      if (usuario.rol === "admin") { router.push("/dashboard"); return }

      // Info de la casa
      const { data: casaData } = await supabase
        .from("casas")
        .select("*")
        .eq("id", usuario.casa_id)
        .single()

      setCasa(casaData)

      // Pagos de su casa
      const { data: pagosData } = await supabase
        .from("pagos")
        .select("*")
        .eq("casa_id", usuario.casa_id)
        .eq("anio", anio)
        .order("created_at", { ascending: false })

      setPagos(pagosData || [])
      setLoading(false)
    }

    fetchData()
  }, [anio])

  // Calcular deudas — meses sin pago de alícuota
  const mesesPagados = pagos
    .filter(p => p.concepto === "Alícuota")
    .map(p => p.mes)

  const mesesDeudores = MESES.filter(m => !mesesPagados.includes(m))

  const pagosFiltrados = tab === "pagados"
    ? pagos.filter(p => p.estado === "pagado")
    : []

  const totalPagado = pagos
    .filter(p => p.estado === "pagado")
    .reduce((acc, p) => acc + parseFloat(p.valor || 0), 0)

  const totalDeuda = mesesDeudores.length * 18 // alícuota fija
    + (casa?.tiene_parqueadero && !pagos.find(p => p.concepto === "Parqueadero") ? 2 : 0)

  return (
    <div className="p-6 max-w-3xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Pagos</h1>
          {casa && (
            <p className="text-gray-500 text-sm mt-1">
              {casa.nombre} — {casa.propietario || ""}
            </p>
          )}
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push("/login")
          }}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Selector año */}
      <div className="flex gap-2 mb-6">
        {[2023, 2024, 2025, 2026].map(a => (
          <button
            key={a}
            onClick={() => setAnio(a)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm
              ${anio === a
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
            Total pagado {anio}
          </p>
          <p className="text-2xl font-bold text-green-700">${totalPagado.toFixed(2)}</p>
        </div>
        <div className={`border rounded-xl p-4 
          ${totalDeuda > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-1
            ${totalDeuda > 0 ? "text-red-500" : "text-gray-500"}`}>
            Deuda pendiente {anio}
          </p>
          <p className={`text-2xl font-bold ${totalDeuda > 0 ? "text-red-600" : "text-gray-400"}`}>
            ${totalDeuda.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("pagados")}
          className={`px-6 py-3 font-medium transition-colors text-sm
            ${tab === "pagados"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          Pagados
        </button>
        <button
          onClick={() => setTab("pendientes")}
          className={`px-6 py-3 font-medium transition-colors text-sm
            ${tab === "pendientes"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          Pendientes {mesesDeudores.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {mesesDeudores.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {/* PAGADOS */}
          {tab === "pagados" && (
            <div className="flex flex-col gap-3">
              {pagosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-sm">No hay pagos registrados para {anio}</p>
                </div>
              ) : (
                pagosFiltrados.map(pago => (
                  <div key={pago.id}
                    className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {pago.concepto}
                          </span>
                          <span className="text-xs text-gray-400">{pago.mes} {pago.anio}</span>
                        </div>
                        {pago.numero_recibo && (
                          <p className="text-xs text-gray-400">Recibo # {pago.numero_recibo}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">
                          ${parseFloat(pago.valor).toFixed(2)}
                        </span>
                        {pago.archivo_url && (
                          <a
                            href={pago.archivo_url}
                            target="_blank"
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600
                              px-3 py-1 rounded-lg transition-colors"
                          >
                            📄 Ver recibo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PENDIENTES */}
          {tab === "pendientes" && (
            <div className="flex flex-col gap-3">
              {mesesDeudores.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="text-sm">¡Al día en {anio}!</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-2">
                    Meses con alícuota pendiente en {anio}:
                  </p>
                  {mesesDeudores.map(mes => (
                    <div key={mes}
                      className="border border-red-100 rounded-xl p-4 bg-red-50 
                        flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-red-700">Alícuota — {mes} {anio}</p>
                        <p className="text-xs text-red-400 mt-0.5">Pendiente de pago</p>
                      </div>
                      <span className="font-bold text-red-600">$18.00</span>
                    </div>
                  ))}
                  {casa?.tiene_parqueadero && !pagos.find(p => p.concepto === "Parqueadero") && (
                    <div className="border border-red-100 rounded-xl p-4 bg-red-50
                      flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-red-700">Parqueadero {anio}</p>
                        <p className="text-xs text-red-400 mt-0.5">Pendiente de pago</p>
                      </div>
                      <span className="font-bold text-red-600">$2.00</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}