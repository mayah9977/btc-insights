import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'THE GOD OF BTC',
  description: 'BTC AI Casino Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* ============================= */}
        {/* PWA / Mobile App Settings */}
        {/* ============================= */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        {/* iOS PWA 대응 (권장) */}
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="THE GOD OF BTC"
        />

        {/* iOS 홈화면 아이콘 (선택) */}
        <link
          rel="apple-touch-icon"
          href="/icon-192.png"
        />
      </head>

      <body>{children}</body>
    </html>
  )
}
