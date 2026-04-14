import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: Request) {
  const { titulo, tipo } = await req.json()

  // Obtener todos los emails de vecinos
  const { data: usuarios } = await supabase.auth.admin.listUsers()
  const emails = usuarios?.users
    .filter(u => u.email)
    .map(u => u.email!) || []

  if (emails.length === 0) {
    return NextResponse.json({ error: "No hay usuarios" }, { status: 400 })
  }

  // Enviar email a cada vecino
  await resend.emails.send({
    from: "Conjunto San Felipe <onboarding@resend.dev>",
    to: emails,
    subject: `📢 Nuevo aviso: ${titulo}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Conjunto Habitacional San Felipe</h2>
        <p>Se ha publicado un nuevo documento en la cartelera:</p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">${titulo}</p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">${tipo}</p>
        </div>
        <p>Ingresa al sistema para verlo.</p>
        <p style="color: #9ca3af; font-size: 12px;">Conjunto San Felipe — Sistema de Administración</p>
      </div>
    `
  })

  return NextResponse.json({ mensaje: "Notificaciones enviadas ✅" })
}