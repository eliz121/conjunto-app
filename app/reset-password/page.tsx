"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function ResetPassword() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email) return
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://conjunto-app-six.vercel.app/nueva-password"
    })

    setEnviado(true)
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }}>
        <div className="text-center text-white p-8 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-4xl mb-4">📧</p>
          <h2 className="text-xl font-bold mb-2">Revisa tu correo</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Te enviamos un link para restablecer tu contraseña
          </p>
          <a href="/login" className="text-xs underline mt-4 block"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            Volver al login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Recuperar contraseña</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Te enviamos un link a tu correo
          </p>
        </div>

        <div className="rounded-2xl p-8 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
          <input
            placeholder="tu@email.com"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          />

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full p-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #e94560, #c23152)" }}
          >
            {loading ? "Enviando..." : "Enviar link →"}
          </button>

          <a href="/login" className="text-center text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            ← Volver al login
          </a>
        </div>
      </div>
    </div>
  )
}