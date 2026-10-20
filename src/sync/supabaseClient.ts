import type { SupabaseClient } from '@supabase/supabase-js'
import { isCloudConfigured, SUPABASE_KEY, SUPABASE_URL } from './cloudConfig'

let clientPromise: Promise<SupabaseClient> | null = null

/**
 * Verbindung zu Supabase. Der Baustein wird erst bei Bedarf geladen, damit die App ohne
 * Anmeldung genauso schnell startet. Ohne Zugangsdaten gibt es keine Verbindung (null).
 */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!isCloudConfigured) return null
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, {
      // Anmeldung bleibt auf dem Gerät gespeichert und wird automatisch verlängert
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  )
  return clientPromise
}
