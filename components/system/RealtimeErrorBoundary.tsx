'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
}

export class RealtimeErrorBoundary extends React.Component<
  Props,
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(
    error: unknown,
    info: unknown
  ) {
    console.error(
      '[RealtimeErrorBoundary]',
      error,
      info
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 rounded border border-red-500/40 bg-red-500/10 text-sm text-red-300">
            Realtime data temporarily unavailable.
          </div>
        )
      )
    }

    return this.props.children
  }
}
