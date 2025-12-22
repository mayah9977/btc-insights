"use client";

import {useTranslations} from "next-intl";
import {useRouter, usePathname} from "next/navigation";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();

  // 첫 페이지에서는 뒤로가기 숨김
  const canGoBack = pathname !== "/en" && pathname !== "/";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        {canGoBack && (
          <button
            onClick={() => router.back()}
            className="text-lg hover:opacity-70 transition"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <span className="font-bold tracking-wide">
          {t("title")}
        </span>
      </div>

      {/* 언어 전환 버튼 */}
      <LanguageSwitcher />
    </header>
  );
}
