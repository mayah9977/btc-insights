import './styles/globals.css'
import ClientBootstrap from './ClientBootstrap'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-neutral-950 text-white antialiased overflow-x-hidden">
        <ClientBootstrap />
        {children}
      </body>
    </html>
  )
}
