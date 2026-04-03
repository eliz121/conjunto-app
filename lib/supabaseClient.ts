import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,      // 👈 guardar sesión
    autoRefreshToken: true,    // 👈 renovar token automático
    storageKey: "condominio",  // 👈 clave en localStorage
  }
})
