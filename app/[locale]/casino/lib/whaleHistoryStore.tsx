'use client'

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react'

export type WhaleLog = {
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  ts: number
  symbol?: string
}

type WhaleHistoryContextType = {
  logs: WhaleLog[]
  pushLog: (log: Omit<WhaleLog, 'ts'>) => void
}

const WhaleHistoryContext =
  createContext<WhaleHistoryContextType | undefined>(undefined)

const MAX_LOGS = 100

export function WhaleHistoryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [logs, setLogs] = useState<WhaleLog[]>([])

  const pushLog = useCallback((log: Omit<WhaleLog, 'ts'>) => {
    setLogs((prev) =>
      [
        {
          ...log,
          ts: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_LOGS),
    )
  }, [])

  const value = useMemo(() => ({ logs, pushLog }), [logs, pushLog])

  return (
    <WhaleHistoryContext.Provider value={value}>
      {children}
    </WhaleHistoryContext.Provider>
  )
}

export function useWhaleHistory() {
  const ctx = useContext(WhaleHistoryContext)
  if (!ctx) {
    throw new Error(
      'useWhaleHistory must be used inside WhaleHistoryProvider',
    )
  }
  return ctx
}
