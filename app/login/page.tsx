"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<"success" | "error" | "">("")

  const mostrarMensaje = (msg: string, tipoMsg: "success" | "error") => {
    setMensaje(msg)
    setTipo(tipoMsg)
    setTimeout(() => { setMensaje(""); setTipo("") }, 3000)
  }

  const handleLogin = async () => {
    if (!email || !password) {
      mostrarMensaje("Completa todos los campos", "error")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      mostrarMensaje("Email o contraseña incorrectos", "error")
      setLoading(false)
      return
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", data.user.id)
      .single()

    setLoading(false)

    if (usuario?.rol === "admin") {
      router.push("/dashboard")
    } else {
      router.push("/mis-pagos")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)"
      }}
    >
      {/* Círculos decorativos */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #e94560, transparent)" }} />
      <div className="absolute bottom-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #0f3460, #e94560)" }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />

      {/* Grid pattern sutil */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Mensaje toast */}
      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white z-50
          font-medium text-sm transition-all
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            🏘️
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Conjunto San Felipe
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Sistema de Administración
          </p>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl p-8 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              Correo electrónico
            </label>
            <input
              placeholder="tu@email.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="p-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="p-3 rounded-xl text-white placeholder-gray-500 outline-none text-sm"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full p-3 rounded-xl font-semibold text-white text-sm mt-2
              transition-all disabled:opacity-50 active:scale-95"
            style={{
              background: loading
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #e94560, #c23152)"
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión →"}
          </button>

          <p className="text-center text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            ¿No tienes cuenta?{" "}
            <a href="/register" className="underline" style={{ color: "rgba(255,255,255,0.7)" }}>
              Regístrate aquí
            </a>
          </p>
          <p className="text-center text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            ¿Olvidaste tu contraseña?{" "}
            <a href="/reset-password" className="underline" style={{ color: "rgba(255,255,255,0.7)" }}>
              Recupérala aquí
            </a>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 Conjunto Habitacional San Felipe
        </p>
      </div>
    </div>
  )
}