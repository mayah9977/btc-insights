// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * 지원 locale 목록
 */
const SUPPORTED_LOCALES = ['ko', 'en', 'ja'] as const;
const DEFAULT_LOCALE = 'ko';

/**
 * VIP 레벨 타입
 */
type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3';

/**
 * 브라우저 언어 기반 locale 감지
 */
function detectLocale(req: NextRequest): string {
  const header = req.headers.get('accept-language');
  if (!header) return DEFAULT_LOCALE;

  const detected = header.split(',')[0].split('-')[0];
  return SUPPORTED_LOCALES.includes(detected as any)
    ? detected
    : DEFAULT_LOCALE;
}

/**
 * 요청 기반 VIP 레벨 결정
 * (③ Stripe / DB 연동 시 이 함수만 교체)
 */
function getVipLevelFromRequest(req: NextRequest): VIPLevel {
  /**
   * TODO (다음 단계):
   * - cookie
   * - session
   * - JWT
   * - Stripe subscription
   */
  return 'VIP2'; // 개발 단계 임시값
}

/**
 * Admin 여부 판단
 * - 현재는 cookie 기반 (dev)
 * - 운영 시 JWT / session / DB로 교체
 */
function isAdminFromRequest(req: NextRequest): boolean {
  /**
   * 예시:
   * cookie: admin=true
   */
  const adminFlag = req.cookies.get('admin')?.value;
  return adminFlag === 'true';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * 0️⃣ 무시해야 할 경로
   */
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt')
  ) {
    return NextResponse.next();
  }

  /**
   * 1️⃣ locale 포함 여부 확인
   */
  const hasLocale = SUPPORTED_LOCALES.some(
    (locale) =>
      pathname === `/${locale}` ||
      pathname.startsWith(`/${locale}/`)
  );

  /**
   * 2️⃣ locale 없는 경우 → 자동 감지 후 리다이렉트
   */
  if (!hasLocale) {
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  /**
   * 3️⃣ Admin 경로 보호
   * - /[locale]/admin/**
   */
  const isAdminRoute =
    pathname.split('/').length >= 3 &&
    pathname.includes('/admin');

  if (isAdminRoute) {
    if (!isAdminFromRequest(req)) {
      const locale = pathname.split('/')[1];
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  /**
   * 4️⃣ VIP 보호 경로 가드
   * - /[locale]/casino/vip
   */
  const isVipRoute = pathname.includes('/casino/vip');

  if (isVipRoute) {
    const vipLevel = getVipLevelFromRequest(req);

    if (vipLevel === 'FREE') {
      const locale = pathname.split('/')[1];
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  /**
   * 5️⃣ 통과
   */
  return NextResponse.next();
}

/**
 * middleware 적용 대상
 */
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
