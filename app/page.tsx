"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuario } = await supabase
          .from("usuarios").select("rol").eq("id", user.id).single()
        if (usuario?.rol === "admin") router.push("/dashboard")
        else router.push("/mis-pagos")
      } else {
        router.push("/login")
      }
    }
    check()
  }, [])

  return null
}