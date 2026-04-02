"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const TIPOS = ["Aviso", "Horario", "Acta", "Reglamento", "Liquidación", "Otro"]

export default function Documentos() {
  const router = useRouter()
  const [documentos, setDocumentos] = useState<any[]>([])
  const [liquidaciones, setLiquidaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [esAdmin, setEsAdmin] = useState(false)
  const [tab, setTab] = useState<"cartelera" | "liquidaciones">("cartelera")

  // Form
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("Aviso")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState("")
  const [tipoMsg, setTipoMsg] = useState<"success" | "error" | "">("")

  const mostrarMensaje = (msg: string, t: "success" | "error") => {
    setMensaje(msg)
    setTipoMsg(t)
    setTimeout(() => {
      setMensaje("")
      setTipoMsg("")
    }, 3000)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single()

      setEsAdmin(usuario?.rol === "admin")

      const { data: docsData } = await supabase
        .from("documentos")
        .select("*")
        .order("created_at", { ascending: false })

      setDocumentos(docsData || [])

      const { data: liqData } = await supabase
        .from("liquidaciones")
        .select("*")
        .eq("publicada", true)
        .order("anio", { ascending: false })
        .order("created_at", { ascending: false })

      setLiquidaciones(liqData || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleSubir = async () => {
    if (!titulo || !archivo) {
      mostrarMensaje("Título y archivo son obligatorios", "error")
      return
    }

    setGuardando(true)

    const ext = archivo.name.split(".").pop()
    const nombre = `doc_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(nombre, archivo, { upsert: false })

    if (uploadError) {
      mostrarMensaje("Error al subir el archivo", "error")
      setGuardando(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("documentos")
      .getPublicUrl(nombre)

    const { error } = await supabase.from("documentos").insert({
      titulo,
      tipo,
      archivo_url: urlData.publicUrl,
      casa_id: null
    })

    if (error) {
      mostrarMensaje("Error al guardar", "error")
      setGuardando(false)
      return
    }

    mostrarMensaje("Documento publicado ✅", "success")
    setTitulo("")
    setTipo("Aviso")
    setArchivo(null)

    const { data } = await supabase
      .from("documentos")
      .select("*")
      .order("created_at", { ascending: false })

    setDocumentos(data || [])
    setGuardando(false)
  }

  const handleEliminar = async (id: string, archivoUrl: string) => {
    if (!confirm("¿Eliminar este documento?")) return

    const nombreArchivo = archivoUrl.split("/").pop()
    if (nombreArchivo) {
      await supabase.storage.from("documentos").remove([nombreArchivo])
    }

    await supabase.from("documentos").delete().eq("id", id)

    setDocumentos(prev => prev.filter(d => d.id !== id))
    mostrarMensaje("Documento eliminado", "success")
  }

  const iconoTipo = (tipo: string) => {
    const iconos: Record<string, string> = {
      "Aviso": "📢",
      "Horario": "🕐",
      "Acta": "📋",
      "Reglamento": "📜",
      "Liquidación": "💰",
      "Otro": "📄"
    }
    return iconos[tipo] || "📄"
  }

  return (
    <div className="p-6 max-w-4xl">

      {mensaje && (
        <div className={`fixed top-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white z-50
          ${tipoMsg === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {mensaje}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cartelera</h1>
        <button
          onClick={() => router.push(esAdmin ? "/dashboard" : "/mis-pagos")}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
        >
          ← Volver
        </button>
      </div>

      <div className="flex gap-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab("cartelera")}
          className={`px-6 py-3 font-medium text-sm
            ${tab === "cartelera"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          📢 Documentos y Avisos
        </button>

        <button
          onClick={() => setTab("liquidaciones")}
          className={`px-6 py-3 font-medium text-sm
            ${tab === "liquidaciones"
              ? "border-b-2 border-black text-black"
              : "text-gray-400 hover:text-gray-600"}`}
        >
          💰 Liquidaciones
          {liquidaciones.length > 0 && (
            <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {liquidaciones.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {tab === "cartelera" && (
            <div className="flex gap-8">

              {esAdmin && (
                <div className="w-80">
                  <h2 className="text-sm font-semibold mb-3">Publicar documento</h2>

                  <input
                    placeholder="Título *"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="border p-2 w-full mb-2"
                  />

                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="border p-2 w-full mb-2"
                  >
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>

                  <input
                    type="file"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    className="mb-2"
                  />

                  <button onClick={handleSubir}>
                    {guardando ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              )}

              <div className="flex-1">
                {documentos.map(doc => (
                  <div key={doc.id} className="border p-3 mb-2">
                    <p>{doc.titulo}</p>

                    <div className="flex gap-2">
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver →
                      </a>

                      {esAdmin && (
                        <button onClick={() => handleEliminar(doc.id, doc.archivo_url)}>
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "liquidaciones" && (
            <div>
              {liquidaciones.map(liq => (
                <div key={liq.id} className="border p-3 mb-2">
                  {liq.mes} {liq.anio}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}