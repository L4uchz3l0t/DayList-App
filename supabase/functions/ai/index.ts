// DayList: deine eigene KI (Supabase Edge Function "ai") – Vorlage zum Ausbauen
//
// POST {action:'classify', text, today, timeZone}
//   → {kind:'task'|'event', title, date?, time?}
// POST {action:'planWeek', wishes, today, timeZone, busy:[{date,from,to,title}], openTasks:[{id,title}]}
//   → {proposals:[{title, kind, date, time?, durationMinutes?, reason?}], question?}
//
// Solange eine Aktion hier mit {error:'not-implemented'} antwortet, rechnet die App selbst mit
// einfachen Regeln (src/ai/rules.ts in der App). Ersetze die Aktionen Schritt für Schritt durch deine KI.
// Einen API-Schlüssel für ein Sprachmodell legst du als Secret an (Edge Functions → Secrets),
// zum Beispiel AI_API_KEY, und liest ihn mit Deno.env.get('AI_API_KEY'). Nie in die App schreiben.
// "Verify JWT" kann an bleiben; der Dienst prüft die Anmeldung zusätzlich selbst.
// Plan und Schnittstelle: plaene/ki-plan.md

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const env = (name: string) => Deno.env.get(name) ?? ''
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Nur angemeldete DayList-Nutzer dürfen die KI benutzen (sonst zahlt jemand Fremdes mit deinem Schlüssel) */
async function signedIn(request: Request): Promise<boolean> {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const { data } = await admin.auth.getUser(token)
  return data.user !== null
}

// deno-lint-ignore no-explicit-any
async function classify(_input: any) {
  // Hier kommt deine KI hin. Beispiel einer gültigen Antwort:
  // return { kind: 'event', title: 'Zahnarzt', date: '2026-10-27', time: '14:30' }
  return null
}

// deno-lint-ignore no-explicit-any
async function planWeek(_input: any) {
  // Hier kommt deine KI hin. Beispiel einer gültigen Antwort:
  // return { proposals: [{ title: 'Wäsche', kind: 'task', date: '2026-10-28' }], question: 'Passt das?' }
  return null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'bad-request' }, 405)
  try {
    if (!(await signedIn(request))) return json({ error: 'not-signed-in' }, 401)
    const input = await request.json().catch(() => ({}))
    const answer =
      input.action === 'classify' ? await classify(input) : input.action === 'planWeek' ? await planWeek(input) : undefined
    if (answer === undefined) return json({ error: 'bad-request' }, 400)
    if (answer === null) return json({ error: 'not-implemented' }, 501)
    return json(answer)
  } catch (error) {
    console.error(error)
    return json({ error: (error as Error).message }, 500)
  }
})
