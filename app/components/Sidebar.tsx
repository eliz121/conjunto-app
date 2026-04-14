"use client"

import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

const links = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/admin/casas", icon: "🏠", label: "Gestionar Casas" },
  { href: "/egresos", icon: "💸", label: "Egresos" },
  { href: "/liquidacion", icon: "📋", label: "Liquidación" },
  { href: "/documentos", icon: "📢", label: "Cartelera" },
  { href: "/prediccion", icon: "🤖", label: "Predicción" },
  { href: "/admin/configuracion", icon: "⚙️", label: "Configuración" },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="w-56 min-h-screen flex flex-col border-r border-gray-200 bg-white fixed left-0 top-0">
      
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏘️</span>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">San Felipe</p>
            <p className="text-xs text-gray-400">Administración</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {links.map(link => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors text-left w-full
              ${pathname === link.href
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push("/login")
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-red-500 hover:bg-red-50 transition-colors w-full"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}