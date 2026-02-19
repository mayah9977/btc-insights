import './styles/globals.css'
import ClientBootstrap from './ClientBootstrap'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-neutral-950 text-white antialiased">
        <ClientBootstrap />
        {children}
      </body>
    </html>
  )
}
