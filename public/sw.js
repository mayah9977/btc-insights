/* =========================================================
 * Service Worker (FINAL)
 * - Push Notification 표시
 * - Push 수신 시 Client(UI)에 ALERT_TRIGGERED 전달
 * ========================================================= */

self.addEventListener('install', () => {
  // 즉시 활성화
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // 모든 클라이언트 제어
  event.waitUntil(self.clients.claim())
})

/* =========================
 * 🔔 PUSH EVENT
 * ========================= */
self.addEventListener('push', event => {
  if (!event.data) return

  let payload = {}

  try {
    payload = event.data.json()
  } catch (e) {
    console.error('[SW] push payload parse error', e)
    return
  }

  const title =
    payload.title ||
    payload.notification?.title ||
    'Signal Alert'

  const body =
    payload.body ||
    payload.notification?.body ||
    '조건이 충족되었습니다.'

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    requireInteraction: true,
    data: {
      ...(payload.data ?? {}),
      __type: 'ALERT_TRIGGERED', // 🔥 핵심 플래그
      clickUrl: payload.data?.clickUrl || '/ko/alerts',
    },
  }

  event.waitUntil(
    (async () => {
      /* 1️⃣ Notification 표시 */
      await self.registration.showNotification(title, options)

      /* 2️⃣ 모든 Client(Window)에 메시지 전달 */
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of clients) {
        client.postMessage({
          type: 'ALERT_TRIGGERED',
          payload: payload.data ?? {},
        })
      }
    })()
  )
})

/* =========================
 * 🔔 NOTIFICATION CLICK
 * ========================= */
self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl =
    event.notification.data?.clickUrl ||
    '/ko/alerts'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if ('navigate' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
