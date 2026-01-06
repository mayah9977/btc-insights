import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Next.js 내부 / API / 정적 파일 무시
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2️⃣ 루트 접근 시 → /ko 로 고정
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/ko';
    return NextResponse.redirect(url);
  }

  // 3️⃣ 이미 /ko 로 시작하면 그대로 통과
  if (pathname.startsWith('/ko')) {
    return NextResponse.next();
  }

  // 4️⃣ 그 외 경로도 강제로 /ko prefix
  const url = req.nextUrl.clone();
  url.pathname = `/ko${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
