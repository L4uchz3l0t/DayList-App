import { getSupabase } from './supabaseClient'

/*
  Push-Benachrichtigungen für Erinnerungen.
  Das Gerät meldet sich einmal beim Push-Dienst des Browsers an (Google, Apple, Mozilla) und speichert
  diese Adresse in der Cloud. Der Erinnerungsdienst (supabase/functions/reminders) schickt dorthin
  zur richtigen Zeit eine Nachricht, die der Service Worker anzeigt (public/push-handler.js).
*/

/** Name des Erinnerungsdienstes in Supabase */
const FUNCTION_NAME = 'reminders'

/**
 * - unsupported:   dieser Browser kann keine Push-Nachrichten
 * - needs-install: iPhone/iPad, die App muss erst auf den Home-Bildschirm
 * - denied:        Benachrichtigungen wurden blockiert
 * - off / on:      auf diesem Gerät aus- oder eingeschaltet
 */
export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on'

export class PushDeniedError extends Error {}

function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function isSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Der öffentliche Schlüssel kommt als Base64-Text, der Browser braucht ihn als Bytes. */
function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  const base64 = (text + '='.repeat((4 - (text.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

export async function getPushState(): Promise<PushState> {
  if (isAppleMobile() && !isInstalled()) return 'needs-install'
  if (!isSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSubscription()) ? 'on' : 'off'
}

async function connect() {
  const client = getSupabase()
  if (!client) throw new Error('Cloud nicht eingerichtet')
  return client
}

/** Fragt nach der Erlaubnis, meldet das Gerät beim Push-Dienst an und speichert die Anmeldung in der Cloud. */
export async function enablePush(): Promise<void> {
  const supabase = await connect()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushDeniedError('Benachrichtigungen nicht erlaubt')

  const { data, error } = await supabase.functions.invoke<{ publicKey: string }>(FUNCTION_NAME, { method: 'GET' })
  if (error) throw error
  if (!data?.publicKey) throw new Error('Der Erinnerungsdienst hat keinen Schlüssel geliefert')

  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(data.publicKey),
    }))
  const { endpoint, keys } = subscription.toJSON()
  const { error: saveError } = await supabase.from('push_subscriptions').upsert(
    { endpoint, p256dh: keys?.p256dh, auth: keys?.auth, device: navigator.userAgent.slice(0, 200) },
    { onConflict: 'endpoint' },
  )
  if (saveError) throw saveError
}

/** Meldet dieses Gerät ab: keine Erinnerungen mehr hierher. */
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription()
  if (!subscription) return
  const supabase = await connect()
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

/** Lässt den Erinnerungsdienst sofort eine Test-Nachricht an alle Geräte dieses Kontos schicken. */
export async function sendTestPush(): Promise<void> {
  const supabase = await connect()
  const { error } = await supabase.functions.invoke(FUNCTION_NAME, { body: { test: true } })
  if (error) throw error
}
