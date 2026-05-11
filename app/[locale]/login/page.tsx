// app/[locale]/login/page.tsx
'use client'

import React, { useState } from 'react'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

/** 🔥 수정 이유:
 * Firebase 에러를 사용자 메시지로 안전하게 변환
 * console.error 사용 시 Next.js dev overlay 발생 가능성 있으므로 사용 금지
 */
const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/invalid-credential':
    'VIP 결제를 완료한 계정으로만 이용하실 수 있습니다.',

  'auth/user-not-found':
    'VIP 결제를 완료한 계정으로만 이용하실 수 있습니다.',

  'auth/wrong-password':
    '비밀번호가 올바르지 않습니다.',

  'auth/too-many-requests':
    '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
}

/** 🔥 수정 이유:
 * overlay 방지용 안전 에러 처리
 * 절대 throw 하지 않음
 * 절대 console.error 사용 안 함
 */
function mapFirebaseError(error: unknown): string {
  try {
    const e = error as any
    const code = e?.code as string | undefined

    if (code && FIREBASE_ERROR_MAP[code]) {
      return FIREBASE_ERROR_MAP[code]
    }

    return '로그인에 실패했습니다.'
  } catch {
    return '로그인에 실패했습니다.'
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    /** 🔥 수정 이유:
     * 중복 submit 방지
     */
    if (loading) return

    setErr(null)
    setLoading(true)

    try {
      const auth = getAuth()

      /** 🔥 수정 이유:
       * Firebase 로그인 성공 결과에서 uid를 가져와 Redis session userId로 저장
       * 기존 email-only 구조에서는 /api/login에서 userId 누락 가능성이 있음
       */
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        pw,
      )

      const firebaseUser = userCredential.user
      const normalizedEmail =
        firebaseUser.email?.trim().toLowerCase() ||
        email.trim().toLowerCase()

      /** 🔥 수정 이유:
       * Firebase uid + email을 /api/login으로 전달하여
       * Redis session에 실제 Firebase user.uid가 저장되도록 함
       */
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          userId: firebaseUser.uid,
          email: normalizedEmail,
        }),
      })

      /** 🔥 수정 이유:
       * /api/login 실패 시 잘못된 session 상태로 이동하지 않도록 차단
       */
      if (!loginRes.ok) {
        setErr('로그인 처리 중 오류가 발생했습니다.')
        return
      }

      router.push('/ko/casino')
    } catch (error) {
      /** 🔥 수정 이유:
       * console.error 금지 (overlay 원인)
       * 개발 디버깅은 console.log만 사용
       */
      console.log('[LOGIN_FAIL_SAFE]', error)

      /** 🔥 수정 이유:
       * 사용자에게는 한글 메시지만 노출
       */
      setErr(mapFirebaseError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const auth = getAuth()

      await signOut(auth)

      await fetch('/api/logout', {
        method: 'POST',

        /** 🔥 수정 이유:
         * cookie/session 유지 안정화
         */
        credentials: 'include',
      })

      router.refresh()

      alert('로그아웃 완료')
    } catch {
      /** 🔥 수정 이유:
       * overlay 방지
       */
      alert('로그아웃 실패')
    }
  }

  /** 🔥 DEV LOGIN */
  async function handleDevLogin() {
    try {
      setLoading(true)
      setErr(null)

      /** 🔥 수정 이유:
       * dev session cookie 유지
       */
      await fetch('/api/dev-login', {
        method: 'POST',
        credentials: 'include',
      })

      /** 🔥 수정 이유:
       * 개발자 로그인은 VIP 계정
       */
      router.push('/ko/casino/vip')
    } catch {
      /** 🔥 수정 이유:
       * overlay 방지
       */
      alert('Dev 로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    // ✅ 기존 UI 유지
    <main className="relative min-h-[100svh] overflow-hidden flex items-center justify-center px-4 py-6 sm:py-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(135deg,#020617,#020617_48%,#052e2b)] text-white">
      {/* ✅ 기존 glow 유지 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.45, 0.7, 0.45],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.08, 1, 1.08],
            opacity: [0.35, 0.58, 0.35],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute right-[-80px] bottom-[-80px] h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        />
      </div>

      {/* ✅ 기존 motion 유지 */}
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.96,
        }}
        animate={
          err
            ? {
                opacity: 1,
                y: 0,
                scale: 1,
                x: [0, -8, 8, -6, 6, -3, 3, 0],
              }
            : {
                opacity: 1,
                y: 0,
                scale: 1,
                x: 0,
              }
        }
        whileHover={{
          boxShadow:
            '0 0 90px rgba(16,185,129,0.24), 0 30px 80px rgba(0,0,0,0.45)',
        }}
        transition={{
          duration: 0.55,
          ease: 'easeOut',
        }}
        className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-[0_0_60px_rgba(16,185,129,0.18)] backdrop-blur-2xl sm:p-8"
      >
        {/* ✅ 기존 inner glow 유지 */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-emerald-400/10" />

        {/* ✅ 기존 header 유지 */}
        <div className="relative mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            VIP ACCESS
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            로그인
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            프리미엄 VIP 서비스를 이용하려면 로그인해주세요
          </p>
        </div>

        {/* ✅ 기존 form 유지 */}
        <form onSubmit={onSubmit} className="relative space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              이메일
            </label>

            <motion.input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)

                /** 🔥 수정 이유:
                 * 입력 시 에러 자동 제거
                 */
                if (err) setErr(null)
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              비밀번호
            </label>

            <motion.input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)

                /** 🔥 수정 이유:
                 * 입력 시 에러 자동 제거
                 */
                if (err) setErr(null)
              }}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
              required
            />
          </div>

          {/* ✅ 기존 버튼 유지 */}
          <motion.button
            type="submit"
            disabled={loading}
            className="group relative mt-2 flex w-full items-center justify-center rounded-2xl bg-emerald-400 py-3 font-bold text-black"
          >
            {loading ? '로그인 중…' : '로그인'}
          </motion.button>

          {/* ✅ 기존 에러 UI 유지 */}
          {err && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {err}
            </motion.p>
          )}
        </form>

        {/* 🔥 DEV LOGIN 유지 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <button onClick={handleDevLogin} className="w-full">
              ⚡ 개발자 로그인
            </button>
          </div>
        )}

        {/* ✅ 기존 로그아웃 유지 */}
        <div className="mt-6">
          <button onClick={handleLogout} className="w-full">
            로그아웃
          </button>
        </div>
      </motion.div>
    </main>
  )
}
