"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const TIPOS_PARQUEADERO = ["Auto", "Moto", "Visita", "Discapacitados"]

export default function AdminCasas() {
  const router = useRouter()
  const [casas, setCasas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchCasas = async () => {
      const { data } = await supabase
        .from("casas").select("*").order("numero", { ascending: true })
      setCasas(data || [])
      setLoading(false)
    }
    fetchCasas()
  }, [])

  const actualizarCasa = async (id: string, campo: string, valor: any) => {
    setCasas(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c))
    setGuardando(id)
    await supabase.from("casas").update({ [campo]: valor }).eq("id", id)
    setGuardando(null)
  }

  const FilaParqueadero = ({ casa, numero }: { casa: any, numero: 1 | 2 }) => {
    const tieneKey = numero === 1 ? "tiene_parqueadero" : "tiene_parqueadero2"
    const tipoKey = numero === 1 ? "tipo_parqueadero" : "tipo_parqueadero2"
    const numKey = numero === 1 ? "numero_parqueadero" : "numero_parqueadero2"

    return (
      <>
        <td className="border border-gray-200 px-3 py-2 text-center">
          <div className="flex items-center gap-1 justify-center">
            <span className="text-xs text-gray-400">P{numero}</span>
            <button
              onClick={() => actualizarCasa(casa.id, tieneKey, !casa[tieneKey])}
              className={`w-12 h-6 rounded-full transition-colors relative
                ${casa[tieneKey] ? "bg-green-400" : "bg-gray-200"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                ${casa[tieneKey] ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
        </td>

        <td className="border border-gray-200 px-2 py-1">
          {casa[tieneKey] ? (
            <select
              value={casa[tipoKey] || ""}
              onChange={(e) => actualizarCasa(casa.id, tipoKey, e.target.value)}
              className="w-full px-2 py-1 rounded border border-gray-200
                focus:outline-none text-gray-700 text-sm bg-white"
            >
              <option value="">Tipo</option>
              {TIPOS_PARQUEADERO.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <span className="text-gray-200 text-center block">—</span>
          )}
        </td>

        <td className="border border-gray-200 px-2 py-1">
          {casa[tieneKey] ? (
            <input
              defaultValue={casa[numKey] || ""}
              placeholder="Ej: P-01"
              onBlur={(e) => {
                if (e.target.value !== casa[numKey]) {
                  actualizarCasa(casa.id, numKey, e.target.value)
                }
              }}
              className="w-full px-2 py-1 rounded border border-transparent
                hover:border-gray-200 focus:border-gray-400 focus:outline-none
                bg-transparent text-gray-700 placeholder-gray-300 text-sm"
            />
          ) : (
            <span className="text-gray-200 text-center block">—</span>
          )}
        </td>
      </>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestionar Casas</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          ← Volver al Dashboard
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Edita el propietario directamente. Activa los parqueaderos con el toggle.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Casa</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">Propietario</th>
                <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700" colSpan={3}>Parqueadero 1</th>
                <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700" colSpan={3}>Parqueadero 2</th>
                <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">Guardado</th>
              </tr>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="border border-gray-200 px-3 py-1" colSpan={2}/>
                <th className="border border-gray-200 px-3 py-1 text-center">Activo</th>
                <th className="border border-gray-200 px-3 py-1 text-center">Tipo</th>
                <th className="border border-gray-200 px-3 py-1 text-center">N°</th>
                <th className="border border-gray-200 px-3 py-1 text-center">Activo</th>
                <th className="border border-gray-200 px-3 py-1 text-center">Tipo</th>
                <th className="border border-gray-200 px-3 py-1 text-center">N°</th>
                <th className="border border-gray-200 px-3 py-1"/>
              </tr>
            </thead>
            <tbody>
              {casas.map(casa => (
                <tr key={casa.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">
                    {casa.nombre}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    <input
                      defaultValue={casa.propietario || ""}
                      placeholder="Sin propietario"
                      onBlur={(e) => {
                        if (e.target.value !== casa.propietario) {
                          actualizarCasa(casa.id, "propietario", e.target.value)
                        }
                      }}
                      className="w-full px-2 py-1 rounded border border-transparent
                        hover:border-gray-200 focus:border-gray-400 focus:outline-none
                        bg-transparent text-gray-700 placeholder-gray-300"
                    />
                  </td>
                  <FilaParqueadero casa={casa} numero={1} />
                  <FilaParqueadero casa={casa} numero={2} />
                  <td className="border border-gray-200 px-3 py-2 text-center text-xs text-gray-400">
                    {guardando === casa.id ? "Guardando..." : "✓"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}