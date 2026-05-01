export async function getUserVIP(): Promise<boolean> {
  try {
    const res = await fetch('/api/vip/status', {
      cache: 'no-store',
    })

    const data = await res.json()

    return data.isVip === true
  } catch {
    return false
  }
}
