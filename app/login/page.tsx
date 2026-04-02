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

    // 1️⃣ Login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      mostrarMensaje("Email o contraseña incorrectos", "error")
      setLoading(false)
      return
    }

    // 2️⃣ Obtener rol
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", data.user.id)
      .single()

    setLoading(false)

    // 3️⃣ Redirigir según rol
    if (usuario?.rol === "admin") {
      router.push("/dashboard")
    } else {
      router.push("/mis-pagos")
    }
  }

  return (
    <div className="p-10 relative">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded shadow-lg text-white
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      <h1 className="text-2xl mb-5">Iniciar Sesión</h1>

      <div className="flex flex-col gap-4 w-80">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 rounded bg-white text-black"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded bg-white text-black"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-black text-white p-3 rounded"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-sm text-gray-500 text-center">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-blue-600 underline">Regístrate</a>
        </p>
      </div>
    </div>
  )
}