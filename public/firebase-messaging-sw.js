/* =========================================================
   Firebase Cloud Messaging – Web Push Service Worker
   - notification + data payload 완전 지원
   - image / badge / actions / requireInteraction
   - clickUrl 딥링크 처리
   ========================================================= */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

/* =========================
   PUSH EVENT
   ========================= */
self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data?.json?.() ?? {}
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
    String(d.requireInteraction)
      .toLowerCase() === 'true'

  const tag =
    d.tag ||
    'btc-signal'

  const renotify =
    String(d.renotify)
      .toLowerCase() === 'true'

  /* ---------- Click URL ---------- */
  const clickUrl =
    d.clickUrl ||
    d.click_action ||
    d.url ||
    '/'

  /* ---------- Actions ---------- */
  const actionOpenTitle =
    d.actionOpenTitle || 'Open'

  const actionCloseTitle =
    d.actionCloseTitle || 'Close'

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
    actions: [
      {
        action: 'open',
        title: actionOpenTitle,
      },
      {
        action: 'close',
        title: actionCloseTitle,
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

/* =========================
   NOTIFICATION CLICK
   ========================= */
self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()

    const action = event.action
    const data =
      event.notification.data || {}

    const targetUrl =
      data.clickUrl || '/'

    // Close 버튼 → 아무 동작 없음
    if (action === 'close') {
      return
    }

    event.waitUntil(
      self.clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            try {
              const url = new URL(
                client.url
              )

              if (
                url.origin ===
                self.location.origin
              ) {
                // 이미 열린 탭 → 포커스
                if (
                  client.url !==
                  targetUrl
                ) {
                  if (
                    'navigate' in
                    client
                  ) {
                    client.navigate(
                      targetUrl
                    )
                  } else {
                    client.postMessage({
                      type: 'FROM_SW_OPEN_URL',
                      url: targetUrl,
                    })
                  }
                }

                return client.focus()
              }
            } catch (e) {
              // ignore
            }
          }

          // 열린 탭이 없으면 새 창
          return self.clients.openWindow(
            targetUrl
          )
        })
    )
  }
)



