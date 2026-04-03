"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

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
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single()

      if (usuario?.rol !== "admin") router.push("/mis-pagos")
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    const fetchCasas = async () => {
      const { data } = await supabase
        .from("casas")
        .select("*")
        .order("numero", { ascending: true })
      setCasas(data || [])
      setLoading(false)
    }
    fetchCasas()
  }, [])

  const actualizarCasa = async (id: string, campo: string, valor: any) => {
    // Actualizar local inmediatamente
    setCasas(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c))

    setGuardando(id)

    await supabase
      .from("casas")
      .update({ [campo]: valor })
      .eq("id", id)

    setGuardando(null)
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

      <p className="text-gray-500 text-sm mb-6">
        Edita el nombre del propietario directamente en la tabla. El toggle activa/desactiva el parqueadero.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full max-w-2xl">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Casa</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Propietario</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Parqueadero</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {casas.map(casa => (
                <tr key={casa.id} className="hover:bg-gray-50">

                  {/* Nombre casa */}
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-800">
                    {casa.nombre}
                  </td>

                  {/* Propietario editable */}
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

                  {/* Toggle parqueadero */}
                  <td className="border border-gray-200 px-4 py-2 text-center">
                    <button
                      onClick={() => actualizarCasa(casa.id, "tiene_parqueadero", !casa.tiene_parqueadero)}
                      className={`w-12 h-6 rounded-full transition-colors relative
                        ${casa.tiene_parqueadero ? "bg-green-400" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                        ${casa.tiene_parqueadero ? "left-7" : "left-1"}`}
                      />
                    </button>
                  </td>

                  {/* Indicador guardando */}
                  <td className="border border-gray-200 px-4 py-2 text-center text-xs text-gray-400">
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