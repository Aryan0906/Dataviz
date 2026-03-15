import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const PLACEHOLDER_VALUES = ['your_supabase_project_url', 'your_supabase_anon_key', '', null, undefined]

export const isSupabaseConfigured =
    !PLACEHOLDER_VALUES.includes(supabaseUrl) &&
    !PLACEHOLDER_VALUES.includes(supabaseAnonKey)

if (!isSupabaseConfigured) {
    console.warn(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
        'in your .env file to enable authentication features.'
    )
}

// When Supabase is not configured, a placeholder client is created solely to satisfy
// import references. All call-sites guard with `isSupabaseConfigured` before using it,
// so no real network requests will be made against this placeholder URL.
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
