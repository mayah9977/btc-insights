// app/layout.tsx
import './styles/globals.css'
import ClientBootstrap from './ClientBootstrap'
import ConsoleProvider from './ConsoleProvider'

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
    <html lang="en">
      <body className="bg-neutral-950 text-white antialiased overflow-x-hidden">
        <ConsoleProvider />
        <ClientBootstrap />
        {children}
      </body>
    </html>
  )
}
