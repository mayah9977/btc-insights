"use client";

import { useRouter, usePathname, useParams } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // ✅ locale 안전 추출
  const locale =
    typeof params?.locale === "string" ? params.locale : "ko";

  // 루트(/)와 /ko 에서는 뒤로가기 숨김
  const canGoBack =
    pathname !== "/" &&
    pathname !== `/${locale}`;

  return (
    <header
      className="
        fixed top-0 left-0 right-0
        h-14
        bg-black text-white
        flex items-center justify-between
        px-4
        z-50
      "
    >
      <div className="flex items-center gap-3">
        {canGoBack && (
          <button
            onClick={() => router.back()}
            className="text-lg hover:opacity-70 transition"
            aria-label="뒤로가기"
          >
            <span aria-hidden>←</span>
          </button>
        )}

        {/* ✅ 로고 클릭 시 항상 locale 루트로 이동 */}
        <button
          onClick={() => router.push(`/${locale}`)}
          className="font-bold tracking-wide hover:opacity-80 transition"
        >
          BTC 인사이트
        </button>
      </div>
    </header>
  );
}
