'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || loading) return

    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) return

      router.refresh()
      router.push('/ko/vip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="email"
        className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white"
      />

      <button
        type="button"
        onClick={login}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black disabled:opacity-50"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </div>
  )
}
