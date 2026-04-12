"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Configuracion() {
  const router = useRouter()
  const [alicuota, setAlicuota] = useState("")
  const [parqueadero, setParqueadero] = useState("")
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<"success" | "error" | "">("")

  const mostrarMensaje = (msg: string, t: "success" | "error") => {
    setMensaje(msg)
    setTipo(t)
    setTimeout(() => { setMensaje(""); setTipo("") }, 3000)
  }

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
    const fetchConfig = async () => {
      const { data } = await supabase.from("configuracion").select("*")
      if (data) {
        const a = data.find(c => c.clave === "alicuota")
        const p = data.find(c => c.clave === "parqueadero")
        if (a) setAlicuota(a.valor)
        if (p) setParqueadero(p.valor)
      }
      setLoading(false)
    }
    fetchConfig()
  }, [])

  const handleGuardar = async () => {
    if (!alicuota || !parqueadero) {
      mostrarMensaje("Completa todos los campos", "error")
      return
    }

    setGuardando(true)

    await supabase.from("configuracion")
      .update({ valor: alicuota })
      .eq("clave", "alicuota")

    await supabase.from("configuracion")
      .update({ valor: parqueadero })
      .eq("clave", "parqueadero")

    setGuardando(false)
    mostrarMensaje("Configuración guardada ✅", "success")
  }

  return (
    <div className="p-6 max-w-md">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white z-50
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <button
          onClick={() => router.push("/dashboard")}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
        >
          ← Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-5">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Valor de alícuota mensual ($)
            </label>
            <input
              value={alicuota}
              onChange={(e) => setAlicuota(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: 18"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Valor de parqueadero mensual ($)
            </label>
            <input
              value={parqueadero}
              onChange={(e) => setParqueadero(e.target.value)}
              className="border border-gray-200 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: 2"
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="bg-black text-white p-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  )
}