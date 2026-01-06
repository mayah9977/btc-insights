"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // 루트(/)와 /ko 에서는 뒤로가기 숨김
  const canGoBack =
    pathname !== "/" &&
    pathname !== "/ko";

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

        <span className="font-bold tracking-wide">
          BTC 인사이트
        </span>
      </div>
    </header>
  );
}
