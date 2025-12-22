self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  self.registration.showNotification(
    data.title || 'Signal Alert',
    {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
    }
  )
})
