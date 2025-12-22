"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar() {
  const pathname = usePathname();

  const menus = [
    { name: "시세", path: "/prices", icon: "₿" },
    { name: "알림", path: "/alerts", icon: "🔔" },
    { name: "카지노", path: "/casino", icon: "🎰" },
    { name: "뉴스", path: "/news", icon: "📰" },
    { name: "설정", path: "/settings", icon: "⚙️" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black text-white flex justify-around items-center border-t border-gray-800 z-50">
      {menus.map(menu => (
        <Link key={menu.path} href={menu.path}>
          <div
            className={`flex flex-col items-center text-sm ${
              pathname.startsWith(menu.path)
                ? "text-purple-400"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">{menu.icon}</span>
            {menu.name}
          </div>
        </Link>
      ))}
    </nav>
  );
}
