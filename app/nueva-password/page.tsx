"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function NuevaPassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")

  const handleActualizar = async () => {
    if (!password || !confirmar) {
      setMensaje("Completa todos los campos")
      return
    }
    if (password !== confirmar) {
      setMensaje("Las contraseñas no coinciden")
      return
    }
    if (password.length < 6) {
      setMensaje("Mínimo 6 caracteres")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMensaje("Error al actualizar — intenta de nuevo")
      setLoading(false)
      return
    }

    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Elige una contraseña segura
          </p>
        </div>

        <div className="rounded-2xl p-8 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>

          {mensaje && (
            <p className="text-red-400 text-sm text-center">{mensaje}</p>
          )}

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmar}
            autoComplete="new-password"
            onChange={(e) => setConfirmar(e.target.value)}
            className="p-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          />

          <button
            onClick={handleActualizar}
            disabled={loading}
            className="w-full p-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #e94560, #c23152)" }}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña →"}
          </button>
        </div>
      </div>
    </div>
  )
}