/*
  Wird vom Service Worker geladen (siehe vite.config.ts, workbox.importScripts).
  Zeigt Erinnerungen an, die der Erinnerungsdienst in der Cloud schickt, auch wenn die App geschlossen ist.
  Ein Tipp auf die Benachrichtigung öffnet die App oder holt sie nach vorn.
*/
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: event.data ? event.data.text() : 'DayList' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'DayList', {
      body: data.body || '',
      icon: 'pwa-192x192.png',
      badge: 'pwa-192x192.png',
      // Gleiche Aufgabe = gleiche Benachrichtigung, damit nichts doppelt erscheint
      tag: data.tag,
      data: { url: data.url || self.registration.scope },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.registration.scope))
      return open ? open.focus() : self.clients.openWindow(url)
    }),
  )
})
