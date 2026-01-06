/* =========================================================
   Firebase / Web Push Service Worker
   - notification + data payload 완전 지원
   - image / badge / actions / requireInteraction
   - clickUrl 딥링크 처리
========================================================= */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/* =========================
   PUSH EVENT
========================= */
self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    console.error('[SW] Push payload parse error:', e)
    payload = {}
  }

  const n = payload.notification || {}
  const d = payload.data || {}

  /* ---------- Content ---------- */
  const title =
    n.title ||
    d.title ||
    'Market Alert'

  const body =
    n.body ||
    d.body ||
    ''

  /* ---------- Visual ---------- */
  const icon =
    n.icon ||
    d.icon ||
    '/icon-192.png'

  const image =
    n.image ||
    d.image ||
    undefined

  const badge =
    d.badge ||
    '/badge-72.png'

  /* ---------- Behavior ---------- */
  const requireInteraction =
    String(d.requireInteraction).toLowerCase() === 'true'

  const renotify =
    String(d.renotify).toLowerCase() === 'true'

  const tag =
    d.tag ||
    `signal-${Date.now()}`

  /* ---------- Click URL ---------- */
  const clickUrl =
    d.clickUrl ||
    d.click_action ||
    d.url ||
    '/'

  /* ---------- Options ---------- */
  const options = {
    body,
    icon,
    image,
    badge,
    tag,
    renotify,
    requireInteraction,
    data: {
      clickUrl,
      raw: d,
    },
  }

  /* ---------- Actions (지원 브라우저만) ---------- */
  if ('actions' in Notification.prototype) {
    options.actions = [
      {
        action: 'open',
        title: d.actionOpenTitle || 'Open',
      },
      {
        action: 'close',
        title: d.actionCloseTitle || 'Close',
      },
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

/* =========================
   NOTIFICATION CLICK
========================= */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}
  const targetUrl = data.clickUrl || '/'

  // Close 버튼 → 아무 동작 없음
  if (action === 'close') return

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url)

            if (clientUrl.origin === self.location.origin) {
              if (client.url !== targetUrl && 'navigate' in client) {
                client.navigate(targetUrl)
              }
              return client.focus()
            }
          } catch (_) {}
        }

        // 열린 탭이 없으면 새 창
        return self.clients.openWindow(targetUrl)
      })
  )
})
