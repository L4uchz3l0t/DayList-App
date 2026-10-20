// DayList-Erinnerungsdienst (Supabase Edge Function "reminders")
//
// GET                      → liefert den öffentlichen Schlüssel für Push-Nachrichten
// POST mit x-cron-secret   → schickt alle fälligen Erinnerungen (läuft jede Minute per Cron)
// POST von der App         → schickt eine Test-Nachricht an die Geräte des angemeldeten Kontos
//
// Geheimnisse (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT, CRON_SECRET.
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase selbst bereit.
// Anleitung: anleitung/erinnerungen-einrichten.md

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

/** Erinnerungen, deren Zeitpunkt bis zu so viele Minuten zurückliegt, werden noch verschickt */
const WINDOW_MINUTES = 15

interface TaskData {
  title?: string
  status?: string
  time?: string
  reminder?: number
  remindAt?: string
}

interface Subscription {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const env = (name: string) => Deno.env.get(name) ?? ''

const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

webpush.setVapidDetails(
  env('VAPID_CONTACT').startsWith('mailto:') ? env('VAPID_CONTACT') : `mailto:${env('VAPID_CONTACT')}`,
  env('VAPID_PUBLIC_KEY'),
  env('VAPID_PRIVATE_KEY'),
)

/** Text der Benachrichtigung, zum Beispiel "Arzt anrufen" / "In 30 Minuten, um 14:30 Uhr" */
function message(data: TaskData) {
  const at = `${data.time} Uhr`
  const minutes = data.reminder ?? 0
  let body = `Jetzt, ${at}`
  if (minutes >= 24 * 60) body = `Morgen um ${at}`
  else if (minutes >= 60) body = `In ${minutes / 60} Std., um ${at}`
  else if (minutes > 0) body = `In ${minutes} Minuten, um ${at}`
  return { title: data.title ?? 'DayList', body }
}

/** Schickt eine Nachricht an alle Geräte. Abgemeldete Geräte (404/410) werden aus der Liste gelöscht. */
async function send(subscriptions: Subscription[], payload: { title: string; body: string; tag?: string }) {
  let sent = 0
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60, urgency: 'high' },
      )
      sent++
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      } else {
        console.error('Push fehlgeschlagen', status, (error as Error).message)
      }
    }
  }
  return sent
}

async function subscriptionsOf(userIds: string[]): Promise<Subscription[]> {
  if (userIds.length === 0) return []
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)
  if (error) throw error
  return data ?? []
}

/** Fällige Erinnerungen suchen, jede nur einmal verschicken (Tabelle push_sent) */
async function sendDueReminders() {
  const now = new Date()
  const from = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000)
  const { data: rows, error } = await admin
    .from('tasks')
    .select('user_id, id, data')
    .eq('deleted', false)
    .gt('data->>remindAt', from.toISOString())
    .lte('data->>remindAt', now.toISOString())
  if (error) throw error

  const due = (rows ?? []).filter((row) => (row.data as TaskData | null)?.status === 'open')
  if (due.length === 0) return { due: 0, sent: 0 }

  // Nur Erinnerungen, die noch nicht verschickt wurden: neue Zeilen kommen zurück, vorhandene nicht
  const { data: fresh, error: markError } = await admin
    .from('push_sent')
    .upsert(
      due.map((row) => ({ user_id: row.user_id, task_id: row.id, remind_at: (row.data as TaskData).remindAt })),
      { onConflict: 'user_id,task_id,remind_at', ignoreDuplicates: true },
    )
    .select('user_id, task_id')
  if (markError) throw markError

  const subscriptions = await subscriptionsOf([...new Set((fresh ?? []).map((row) => row.user_id))])
  let sent = 0
  for (const { user_id, task_id } of fresh ?? []) {
    const row = due.find((candidate) => candidate.user_id === user_id && candidate.id === task_id)
    if (!row) continue
    const devices = subscriptions.filter((subscription) => subscription.user_id === user_id)
    sent += await send(devices, { ...message(row.data as TaskData), tag: task_id })
  }

  // Alte Einträge aufräumen
  await admin.from('push_sent').delete().lt('sent_at', new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())
  return { due: fresh?.length ?? 0, sent }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    if (request.method === 'GET') return json({ publicKey: env('VAPID_PUBLIC_KEY') })

    if (request.method !== 'POST') return json({ error: 'Methode nicht erlaubt' }, 405)

    const cronSecret = env('CRON_SECRET')
    if (cronSecret && request.headers.get('x-cron-secret') === cronSecret) {
      return json(await sendDueReminders())
    }

    // Test-Nachricht: nur für das angemeldete Konto
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    if (!auth.user) return json({ error: 'Nicht angemeldet' }, 401)
    const sent = await send(await subscriptionsOf([auth.user.id]), {
      title: 'DayList',
      body: 'Test: So sehen deine Erinnerungen aus.',
      tag: 'test',
    })
    return json({ sent })
  } catch (error) {
    console.error(error)
    return json({ error: (error as Error).message }, 500)
  }
})
