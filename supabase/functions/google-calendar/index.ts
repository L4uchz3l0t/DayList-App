// DayList: Google Kalender (Supabase Edge Function "google-calendar"), nur lesen
//
// POST {action:'start', returnTo}   → Adresse der Google-Anmeldung für das angemeldete DayList-Konto
// GET  ?code=…&state=…              → Google schickt nach der Anmeldung hierher zurück, danach zurück in die App
// POST {action:'sync', from, to, timeZone} → Verbindung, Kalenderliste und Termine im Zeitraum
// POST {action:'select', calendars} → gewählte Kalender speichern
// POST {action:'disconnect'}        → Verbindung trennen und Zugang bei Google zurückziehen
//
// Geheimnisse (Edge Functions → Secrets): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
// Optional: APP_URL (Adresse der App, Standard: die Netlify-Adresse).
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase selbst bereit.
// "Verify JWT" muss aus sein, weil Google ohne DayList-Anmeldung zurückschickt; die App-Aufrufe prüft der Dienst selbst.
// Anleitung: anleitung/google-kalender-einrichten.md

import { createClient } from 'npm:@supabase/supabase-js@2'

const SCOPES = 'openid email https://www.googleapis.com/auth/calendar.readonly'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const API = 'https://www.googleapis.com/calendar/v3'
/** So lange gilt ein Anmelde-Merkzettel */
const STATE_MINUTES = 15
/** Höchstens so viele Tage auf einmal abholen */
const MAX_RANGE_DAYS = 400

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const env = (name: string) => Deno.env.get(name) ?? ''
const appUrls = () => (env('APP_URL') || 'https://daylist-l4uchz3l0t.netlify.app').split(',').map((url) => url.trim())
const redirectUri = () => `${env('SUPABASE_URL')}/functions/v1/google-calendar`

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Fehler mit festem Kennwort, das die App versteht */
class KnownError extends Error {
  constructor(
    public code: 'not-configured' | 'not-signed-in' | 'not-connected' | 'expired' | 'bad-request',
    public status: number,
  ) {
    super(code)
  }
}

/** Zurück nur in die eigene App (oder zum Ausprobieren auf dem eigenen Rechner), nie auf fremde Seiten */
function allowedReturn(url: string): boolean {
  try {
    const { origin, hostname } = new URL(url)
    return appUrls().some((app) => new URL(app).origin === origin) || hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

async function userOf(request: Request): Promise<string> {
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!data.user) throw new KnownError('not-signed-in', 401)
  return data.user.id
}

async function google(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

async function tokenRequest(fields: Record<string, string>) {
  return google(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), ...fields }),
  })
}

interface Connection {
  user_id: string
  google_email: string | null
  refresh_token: string
  calendars: string[] | null
}

async function connectionOf(userId: string): Promise<Connection | null> {
  const { data, error } = await admin.from('google_connections').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

/** Kurzlebiger Zugang für die Kalender-Abfragen. Hat jemand den Zugang bei Google entzogen, ist die Verbindung weg. */
async function accessTokenFor(connection: Connection): Promise<string> {
  const { ok, body } = await tokenRequest({ grant_type: 'refresh_token', refresh_token: connection.refresh_token })
  if (ok && body.access_token) return body.access_token
  if (body.error === 'invalid_grant') {
    await admin.from('google_connections').delete().eq('user_id', connection.user_id)
    throw new KnownError('expired', 409)
  }
  throw new Error(`Google: ${body.error_description ?? body.error ?? 'Zugang nicht erneuert'}`)
}

interface CalendarInfo {
  id: string
  name: string
  color: string
  shown: boolean
}

async function calendarsOf(connection: Connection, accessToken: string): Promise<CalendarInfo[]> {
  const { ok, body } = await google(`${API}/users/me/calendarList?minAccessRole=reader`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!ok) throw new Error(`Google: Kalenderliste (${body.error?.message ?? 'Fehler'})`)
  const items = (body.items ?? []) as {
    id: string
    summary?: string
    summaryOverride?: string
    backgroundColor?: string
    primary?: boolean
    selected?: boolean
  }[]
  return items.map((item) => ({
    id: item.id,
    name: item.summaryOverride ?? item.summary ?? item.id,
    color: item.backgroundColor ?? '#2f6db5',
    shown: connection.calendars ? connection.calendars.includes(item.id) : Boolean(item.primary || item.selected),
  }))
}

interface GoogleTime {
  date?: string
  dateTime?: string
}

async function eventsOf(calendars: CalendarInfo[], accessToken: string, from: string, to: string, timeZone: string) {
  const lists = await Promise.all(
    calendars
      .filter((calendar) => calendar.shown)
      .map(async (calendar) => {
        const params = new URLSearchParams({
          timeMin: from,
          timeMax: to,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500',
          ...(timeZone ? { timeZone } : {}),
        })
        const { ok, body } = await google(`${API}/calendars/${encodeURIComponent(calendar.id)}/events?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!ok) {
          console.error('Termine nicht lesbar', calendar.id, body.error?.message)
          return []
        }
        const items = (body.items ?? []) as {
          id: string
          status?: string
          summary?: string
          location?: string
          htmlLink?: string
          start?: GoogleTime
          end?: GoogleTime
        }[]
        return items
          .filter((item) => item.status !== 'cancelled' && item.start)
          .map((item) => ({
            id: `${calendar.id}/${item.id}`,
            title: item.summary || '(ohne Titel)',
            start: item.start,
            end: item.end ?? item.start,
            location: item.location,
            link: item.htmlLink,
            calendar: calendar.name,
            color: calendar.color,
          }))
      }),
  )
  return lists.flat()
}

async function start(userId: string, returnTo: string) {
  if (!allowedReturn(returnTo)) throw new KnownError('bad-request', 400)
  const state = crypto.randomUUID()
  await admin
    .from('google_oauth_states')
    .delete()
    .lt('created_at', new Date(Date.now() - STATE_MINUTES * 60 * 1000).toISOString())
  const { error } = await admin.from('google_oauth_states').insert({ state, user_id: userId, return_to: returnTo })
  if (error) throw error
  const params = new URLSearchParams({
    client_id: env('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES,
    // Ohne diese beiden gibt Google keinen langlebigen Schlüssel heraus
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return { url: `${AUTH_URL}?${params}` }
}

/** Google schickt hierher zurück. Danach geht es mit ?google=connected (oder =error) zurück in die App. */
async function callback(url: URL): Promise<Response> {
  const state = url.searchParams.get('state') ?? ''
  const { data: saved } = await admin.from('google_oauth_states').delete().eq('state', state).select().maybeSingle()
  const fresh = saved && Date.now() - new Date(saved.created_at).getTime() < STATE_MINUTES * 60 * 1000
  if (!saved || !fresh) return new Response('Die Anmeldung ist abgelaufen. Bitte in DayList neu verbinden.', { status: 400 })

  const back = (result: string) => {
    const target = new URL(saved.return_to)
    target.searchParams.set('google', result)
    return Response.redirect(target.toString(), 302)
  }

  const code = url.searchParams.get('code')
  if (!code) return back(url.searchParams.get('error') === 'access_denied' ? 'denied' : 'error')

  const { ok, body } = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() })
  if (!ok || !body.refresh_token) {
    console.error('Google-Anmeldung fehlgeschlagen', body.error, body.error_description)
    return back('error')
  }
  // Die E-Mail-Adresse steht im id_token, der direkt von Google kommt
  let email: string | null = null
  try {
    email = JSON.parse(atob(body.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email ?? null
  } catch {
    email = null
  }
  const { error } = await admin.from('google_connections').upsert({
    user_id: saved.user_id,
    google_email: email,
    refresh_token: body.refresh_token,
    calendars: null,
    updated_at: new Date().toISOString(),
  })
  if (error) {
    console.error(error)
    return back('error')
  }
  return back('connected')
}

async function sync(userId: string, input: { from?: string; to?: string; timeZone?: string }) {
  const connection = await connectionOf(userId)
  if (!connection) return { connected: false }
  const from = new Date(input.from ?? '')
  const to = new Date(input.to ?? '')
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from || to.getTime() - from.getTime() > MAX_RANGE_DAYS * 864e5) {
    throw new KnownError('bad-request', 400)
  }
  const accessToken = await accessTokenFor(connection)
  const calendars = await calendarsOf(connection, accessToken)
  const events = await eventsOf(calendars, accessToken, from.toISOString(), to.toISOString(), input.timeZone ?? '')
  return { connected: true, email: connection.google_email, calendars, events }
}

async function select(userId: string, calendars: unknown) {
  if (!Array.isArray(calendars) || !calendars.every((id) => typeof id === 'string')) throw new KnownError('bad-request', 400)
  const { data, error } = await admin.from('google_connections').update({ calendars }).eq('user_id', userId).select('user_id')
  if (error) throw error
  if (!data?.length) throw new KnownError('not-connected', 409)
  return { ok: true }
}

async function disconnect(userId: string) {
  const connection = await connectionOf(userId)
  if (!connection) return { ok: true }
  // Zugang auch bei Google zurückziehen; klappt das nicht, ist er spätestens nach dem Löschen hier nutzlos
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(connection.refresh_token)}`, { method: 'POST' }).catch(() => {})
  await admin.from('google_connections').delete().eq('user_id', userId)
  return { ok: true }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    if (!env('GOOGLE_CLIENT_ID') || !env('GOOGLE_CLIENT_SECRET')) throw new KnownError('not-configured', 503)
    const url = new URL(request.url)
    if (request.method === 'GET') return await callback(url)
    if (request.method !== 'POST') return json({ error: 'bad-request' }, 405)

    const userId = await userOf(request)
    const input = await request.json().catch(() => ({}))
    switch (input.action) {
      case 'start':
        return json(await start(userId, String(input.returnTo ?? '')))
      case 'sync':
        return json(await sync(userId, input))
      case 'select':
        return json(await select(userId, input.calendars))
      case 'disconnect':
        return json(await disconnect(userId))
      default:
        throw new KnownError('bad-request', 400)
    }
  } catch (error) {
    if (error instanceof KnownError) return json({ error: error.code }, error.status)
    console.error(error)
    return json({ error: (error as Error).message }, 500)
  }
})
