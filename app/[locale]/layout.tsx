import type { ReactNode } from 'react'
import Header from '@/components/common/header'
import LocaleClientBootstrap from './LocaleClientBootstrap'

export default function LocaleLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <LocaleClientBootstrap />
      <Header />

      <main className="pt-14">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </>
  )
}
