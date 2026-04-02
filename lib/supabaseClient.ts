import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wccjsifbnbdabsdvnunj.supabase.co"
const supabaseKey = "sb_publishable_X7r6VKN1AzCD66_sjE7Atw_VhYimtNN"

export const supabase = createClient(supabaseUrl, supabaseKey)
