"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Prediccion() {
  const router = useRouter()
  const [datos, setDatos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"todos" | "morosos" | "irregulares" | "buenos">("todos")

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
    const fetchPrediccion = async () => {
      setLoading(true)
      const res = await fetch("http://localhost:8000/prediccion")
      const data = await res.json()
      setDatos(data)
      setLoading(false)
    }
    fetchPrediccion()
  }, [])

  const datosFiltrados = datos.filter(d => {
    if (filtro === "morosos") return d.cluster === 1
    if (filtro === "irregulares") return d.cluster === 2
    if (filtro === "buenos") return d.cluster === 0
    return true
  })

  const totalMorosos = datos.filter(d => d.es_moroso).length
  const totalIrregulares = datos.filter(d => d.cluster === 2).length
  const totalBuenos = datos.filter(d => d.cluster === 0).length

  const colorProbabilidad = (prob: number) => {
    if (prob >= 70) return "text-red-600 font-bold"
    if (prob >= 30) return "text-yellow-600 font-bold"
    return "text-green-600"
  }

  const badgePerfil = (perfil: string) => {
    if (perfil === "Moroso crónico") return "bg-red-100 text-red-700"
    if (perfil === "Irregular") return "bg-yellow-100 text-yellow-700"
    return "bg-green-100 text-green-700"
  }

  return (
    <div className="p-6 max-w-5xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Predicción de Morosos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Modelo Random Forest — basado en historial 2015-2026
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm"
        >
          ← Dashboard
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

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">
            Morosos crónicos
          </p>
          <p className="text-3xl font-bold text-red-600">{totalMorosos}</p>
          <p className="text-xs text-red-400 mt-1">alto riesgo</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">
            Irregulares
          </p>
          <p className="text-3xl font-bold text-yellow-600">{totalIrregulares}</p>
          <p className="text-xs text-yellow-400 mt-1">riesgo medio</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
            Buenos pagadores
          </p>
          <p className="text-3xl font-bold text-green-600">{totalBuenos}</p>
          <p className="text-xs text-green-400 mt-1">bajo riesgo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "todos", label: "Todos" },
          { key: "morosos", label: "🔴 Morosos" },
          { key: "irregulares", label: "🟡 Irregulares" },
          { key: "buenos", label: "🟢 Buenos" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filtro === f.key
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-400 text-sm">Cargando predicciones...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Casa</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Propietario</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Meses pagados</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Cumplimiento</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Prob. mora</th>
                <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-medium text-gray-800">
                    {d.casa}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-gray-600">
                    {d.propietario}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-gray-700">
                    {d.meses_pagados}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            d.ratio_cumplimiento >= 70 ? "bg-green-400" :
                            d.ratio_cumplimiento >= 40 ? "bg-yellow-400" : "bg-red-400"
                          }`}
                          style={{ width: `${d.ratio_cumplimiento}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{d.ratio_cumplimiento}%</span>
                    </div>
                  </td>
                  <td className={`border border-gray-200 px-4 py-2 text-center ${colorProbabilidad(d.probabilidad_mora)}`}>
                    {d.probabilidad_mora}%
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgePerfil(d.perfil)}`}>
                      {d.perfil}
                    </span>
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