export async function saveNotificationSettings(settings: any) {
  await fetch('/api/settings/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}
