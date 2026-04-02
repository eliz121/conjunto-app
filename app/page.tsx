"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Home() {
  const [casas, setCasas] = useState<any[]>([])
  const [casa, setCasa] = useState("")
  const [mes, setMes] = useState("")
  const [valor, setValor] = useState("")
  const [concepto, setConcepto] = useState("")
  const [estado, setEstado] = useState("pagado")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<"success" | "error" | "">("")
  const fileRef = useRef<HTMLInputElement>(null)

  const mostrarMensaje = (msg: string, tipoMsg: "success" | "error") => {
    setMensaje(msg)
    setTipo(tipoMsg)
    setTimeout(() => { setMensaje(""); setTipo("") }, 3000)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!casa || !mes || !valor || !concepto) {
      mostrarMensaje("Completa todos los campos obligatorios", "error")
      return
    }

    const valorNumero = parseFloat(valor.replace(",", "."))
    if (isNaN(valorNumero)) {
      mostrarMensaje("Valor inválido", "error")
      return
    }

    setLoading(true)

    // 1️⃣ Subir archivo al bucket si existe
    let archivoUrl = ""

    if (archivo) {
      const extension = archivo.name.split(".").pop()
      const nombreArchivo = `${casa}_${mes}_${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("comprobantes") // 👈 nombre de tu bucket
        .upload(nombreArchivo, archivo, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        mostrarMensaje("Error al subir el comprobante", "error")
        setLoading(false)
        return
      }

      // 2️⃣ Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("comprobantes")
        .getPublicUrl(nombreArchivo)

      archivoUrl = urlData.publicUrl
    }

    // 3️⃣ Insertar pago
    const { error } = await supabase.from("pagos").insert([
      {
        casa_id: casa,
        mes,
        anio: new Date().getFullYear(),
        valor: valorNumero,
        concepto,
        estado,
        archivo_url: archivoUrl, // 👈 tu columna se llama archivo_url
      }
    ])

    setLoading(false)

    if (error) {
      console.error(error)
      mostrarMensaje("Error al guardar el pago", "error")
      return
    }

    mostrarMensaje("Pago guardado correctamente ✅", "success")
    setCasa(""); setMes(""); setValor(""); setConcepto("")
    setEstado("pagado"); setArchivo(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="p-10 relative">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded shadow-lg text-white
          ${tipo === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      <div className="mb-5">
        <Link href="/register" className="text-blue-600 underline">Ir a registro</Link>
      </div>

      <h1 className="text-2xl mb-5">Registrar Pago</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">

        <select value={casa} onChange={(e) => setCasa(e.target.value)}
          className="border p-3 rounded bg-white text-black">
          <option value="">Selecciona tu casa</option>
          {casas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select value={mes} onChange={(e) => setMes(e.target.value)}
          className="border p-3 rounded bg-white text-black">
          <option value="">Selecciona el mes</option>
          {["Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input placeholder="Valor" value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="border p-3 rounded bg-white text-black" />

        <input placeholder="Concepto" value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className="border p-3 rounded bg-white text-black" />

        <select value={estado} onChange={(e) => setEstado(e.target.value)}
          className="border p-3 rounded bg-white text-black">
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
        </select>

        {/* 📎 Upload real */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600">Comprobante (opcional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            className="border p-2 rounded bg-white text-black text-sm"
          />
          {archivo && (
            <span className="text-xs text-gray-500 truncate">{archivo.name}</span>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="bg-black text-white p-3 rounded">
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  )
}