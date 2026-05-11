'use client'

import { useState } from 'react'

type Props = {
  title: string
  onSubmit: (email: string, pw: string) => void | Promise<void>
  loading?: boolean
  error?: string | null
  onChange?: () => void // ✅ 추가 (핵심)
}

export default function AuthForm({
  title,
  onSubmit,
  loading,
  error,
  onChange,
}: Props) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(email, pw)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold text-center">{title}</h1>

      <input
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          onChange?.() // ✅ 입력 시 에러 제거
        }}
        placeholder="이메일"
        className="w-full px-4 py-3 rounded bg-black/30"
      />

      <input
        type="password"
        value={pw}
        onChange={(e) => {
          setPw(e.target.value)
          onChange?.() // ✅ 입력 시 에러 제거
        }}
        placeholder="비밀번호"
        className="w-full px-4 py-3 rounded bg-black/30"
      />

      {error && <p className="text-red-400">{error}</p>}

      <button className="w-full py-3 bg-emerald-400 text-black font-bold rounded">
        {loading ? '처리 중...' : '진행하기'}
      </button>
    </form>
  )
}
