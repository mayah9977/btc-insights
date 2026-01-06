// components/ui/Section.tsx
import type { ReactNode } from 'react'

export default function Section({
  children,
  tight = false,
}: {
  children: ReactNode
  tight?: boolean
}) {
  return (
    <section
      className={
        tight
          ? 'space-y-4'
          : 'space-y-8'
      }
    >
      {children}
    </section>
  )
}
