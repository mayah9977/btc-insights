// /lib/auth/getUserVIP.ts

/**
 * ✅ VIP discrimination function for actual service
 * - Current: localStorage / cookie based
 * - Future: DB/payment system connection possible
 */
export async function getUserVIP(userId?: string): Promise<boolean> {
  try {
    // ✅ dev-only VIP override
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_FORCE_VIP === 'true'
    ) {
      return true
    }

    // ✅ 1. Client environment (UI / SSE)
    if (typeof window !== 'undefined') {
      const vipFlag = localStorage.getItem('vip')
      return vipFlag === 'true'
    }

    // ✅ 2. Server environment (PUSH)
    // TODO: Integrate with DB / Redis / Subscription services in the future
    if (userId) {
      // Example: userId-based query structure
      // const user = await db.user.find(userId)
      // return user.subscription === 'VIP'

      return false
    }

    return false
  } catch {
    return false
  }
}
