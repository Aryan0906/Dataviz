import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured =
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_project_url' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key'

if (!isConfigured) {
    console.warn(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    )
}

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key')
