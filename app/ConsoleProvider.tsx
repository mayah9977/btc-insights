// app/ConsoleProvider.tsx
'use client'

import { useEffect } from 'react'
import { setupConsoleOverride } from '@/lib/consoleOverride'

export default function ConsoleProvider() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setupConsoleOverride()
    }
  }, [])

  return null
}
