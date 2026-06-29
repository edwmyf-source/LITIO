import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const isPlaceholder = (v) => !v || typeof v !== 'string' || v.includes('TU-PROYECTO') || v.trim() === ''
const urlValid = !isPlaceholder(url) && url.startsWith('http')
const keyValid = !isPlaceholder(key) && key.length > 20

export const hasSupabaseEnv = urlValid && keyValid

export const supabase = hasSupabaseEnv
  ? createClient(url, key, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        // detectSessionInUrl en FALSE: era la causa del cuelgue al recargar.
        // Al estar en true, el cliente intentaba parsear la URL buscando un
        // token OAuth en cada carga, bloqueando las queries hasta resolverlo.
        // Esta app no usa OAuth con redirect, así que no lo necesita.
        detectSessionInUrl: false,
        flowType:           'implicit',
        storageKey:         'rodio-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: { eventsPerSecond: 2 },
      },
      db: { schema: 'public' },
    })
  : null
