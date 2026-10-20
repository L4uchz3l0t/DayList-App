/*
  Meldet den Service Worker an, der die App fürs Offline-Starten auf dem Gerät speichert.
  Gibt es auf dem Server eine neue Version, lädt er sie im Hintergrund, übernimmt die App
  und die Seite lädt sich danach einmal selbst neu. Installierte Apps auf dem Handy werden oft
  nur aus dem Hintergrund geholt statt neu geöffnet, deshalb wird bei jeder Rückkehr in die App
  nach Updates gesucht.
*/
export function registerServiceWorker() {
  // Im Entwicklungsmodus (npm run dev) gibt es keinen Service Worker
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return

  // Neu laden nur, wenn eine alte Version abgelöst wurde, nicht bei der allerersten Installation
  let controller = navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controller && !reloading) {
      reloading = true
      window.location.reload()
    }
    controller = navigator.serviceWorker.controller
  })

  const base = import.meta.env.BASE_URL
  navigator.serviceWorker
    .register(`${base}sw.js`, { scope: base })
    .then((registration) => {
      // Manche Umgebungen (zum Beispiel Testbrowser mit gesperrten Service Workern) liefern keine Anmeldung
      if (!registration) return
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', checkForUpdate)
      window.setInterval(checkForUpdate, 60 * 60 * 1000)
    })
    .catch((error: unknown) => console.error('Service Worker konnte nicht angemeldet werden', error))
}
