// /lib/auth/getUserVIP.ts

/**
 * ✅ 실제 서비스용 VIP 판별 함수
 * - 현재: localStorage / cookie 기반
 * - 추후: DB / 결제 시스템 연결 가능
 */

export async function getUserVIP(userId?: string): Promise<boolean> {
  try {
    // ✅ 1. 클라이언트 환경 (UI / SSE)
    if (typeof window !== 'undefined') {
      const vipFlag = localStorage.getItem('vip')
      return vipFlag === 'true'
    }

    // ✅ 2. 서버 환경 (PUSH)
    // TODO: 추후 DB / Redis / Subscription 서비스 연동
    if (userId) {
      // 예시: userId 기반 조회 구조
      // const user = await db.user.find(userId)
      // return user.subscription === 'VIP'

      return false
    }

    return false
  } catch {
    return false
  }
}
