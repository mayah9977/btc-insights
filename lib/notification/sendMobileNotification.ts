type Payload = {
  title: string
  body: string
}

export function sendMobileNotification({
  title,
  body,
}: Payload) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    body,
    icon: '/icon-192.png', // 있으면 사용
    badge: '/badge-72.png', // 선택
  })
}
