"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [casa, setCasa] = useState("")
  const [casas, setCasas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<"success" | "error" | "">("")

  const mostrarMensaje = (msg: string, tipoMsg: any) => {
    setMensaje(msg)
    setTipo(tipoMsg)

    setTimeout(() => {
      setMensaje("")
      setTipo("")
    }, 3000)
  }

  useEffect(() => {
    const fetchCasas = async () => {
      const { data } = await supabase
        .from("casas")
        .select("*")
        .order("numero", { ascending: true })

      setCasas(data || [])
    }

    fetchCasas()
  }, [])

  const handleRegister = async () => {
    if (!email || !password || !casa) {
      mostrarMensaje("Completa todos los campos", "error")
      return
    }

    setLoading(true)

    // 🔍 verificar casa ya registrada
    const { data: existe } = await supabase
      .from("usuarios")
      .select("id")
      .eq("casa_id", casa)

    if (existe && existe.length > 0) {
      mostrarMensaje("Esta casa ya está registrada", "error")
      setLoading(false)
      return
    }

    // 🔐 crear usuario
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      mostrarMensaje(error.message, "error")
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      mostrarMensaje("Error creando usuario", "error")
      setLoading(false)
      return
    }

    // 💾 guardar en tabla usuarios
    const { error: errorInsert } = await supabase.from("usuarios").insert({
      id: user.id,
      casa_id: casa,
      rol: "vecino"
    })

    if (errorInsert) {
      console.error(errorInsert)
      mostrarMensaje("Error guardando usuario", "error")
      setLoading(false)
      return
    }

    mostrarMensaje("Cuenta creada correctamente ✅", "success")

    setEmail("")
    setPassword("")
    setCasa("")
    setLoading(false)
  }

  return (
    <div className="p-10 relative">

      {/* 🔥 MENSAJE BONITO */}
      {mensaje && (
        <div className={`
          fixed top-5 right-5 px-5 py-3 rounded shadow-lg text-white
          ${tipo === "success" ? "bg-green-500" : ""}
          ${tipo === "error" ? "bg-red-500" : ""}
        `}>
          {mensaje}
        </div>
      )}

      <h1 className="text-2xl mb-5">Registro</h1>

      <div className="flex flex-col gap-4 w-80">

        {/* email */}
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 rounded bg-white text-black"
        />

        {/* password */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded bg-white text-black"
        />

        {/* casa */}
        <select
          value={casa}
          onChange={(e) => setCasa(e.target.value)}
          className="border p-3 rounded bg-white text-black"
        >
          <option value="">Selecciona tu casa</option>
          {casas.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <button
          onClick={handleRegister}
          className="bg-black text-white p-3 rounded"
          disabled={loading}
        >
          {loading ? "Creando..." : "Registrarse"}
        </button>
      </div>
    </div>
  )
}