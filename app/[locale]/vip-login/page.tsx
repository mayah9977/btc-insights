// app/[locale]/vip-login/page.tsx

'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import '@/lib/firebase/client'

type FirebaseLoginError = {
  code?: string
}

type SessionSyncState = {
  uid: string
  promise: Promise<boolean>
}

/**
 * Firebase Auth 개발자용 에러 코드를
 * 사용자에게 노출하지 않기 위해 한국어 안내 문구로 변환합니다.
 */
function getVipLoginErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? (error as FirebaseLoginError).code
      : undefined

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
      return '비밀번호가 일치하지 않습니다.'

    case 'auth/user-not-found':
      return 'VIP 계정이 존재하지 않습니다.'

    case 'auth/too-many-requests':
      return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'

    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다.'

    default:
      return 'VIP 계정으로만 로그인 가능합니다.'
  }
}

/**
 * Next.js 16 + Turbopack 개발 모드에서
 * 예상 가능한 Firebase 로그인 실패를 console.error로 출력하면
 * React runtime overlay가 표시될 수 있으므로,
 * 실제 앱 예외와 예상 로그인 실패를 분리합니다.
 */
function isExpectedFirebaseLoginError(error: unknown): boolean {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? (error as FirebaseLoginError).code
      : undefined

  return (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/too-many-requests' ||
    code === 'auth/network-request-failed'
  )
}

export default function VIPLoginPage() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const sessionSyncRef =
    useRef<SessionSyncState | null>(null)

  const router = useRouter()
  const params = useParams()

  const locale =
    typeof params?.locale === 'string'
      ? params.locale
      : 'ko'

  async function syncRedisSession(user: User) {
    const existing = sessionSyncRef.current

    if (
      existing &&
      existing.uid === user.uid
    ) {
      return existing.promise
    }

    const promise = (async (): Promise<boolean> => {
      try {
        const idToken =
          await user.getIdToken(true)

        if (!idToken) {
          return false
        }

        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            idToken,
          }),
        })

        if (!loginRes.ok) {
          return false
        }

        return true
      } catch (error) {
        console.error(
          '[VIP_LOGIN] syncRedisSession failed',
          error,
        )

        return false
      }
    })()

    sessionSyncRef.current = {
      uid: user.uid,
      promise,
    }

    const ok = await promise

    if (
      !ok &&
      sessionSyncRef.current?.promise === promise
    ) {
      sessionSyncRef.current = null
    }

    return ok
  }

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setCurrentUser(user)
        setAuthLoading(false)

        if (!user) {
          sessionSyncRef.current = null
          return
        }

        if (user.email) {
          setEmail(user.email)
        }

        const ok = await syncRedisSession(user)

        if (!ok) {
          setErr('세션 생성 실패')
        }

        router.refresh()
      },
    )

    return () => unsubscribe()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    setErr(null)
    setMessage(null)
    setLoading(true)

    try {
      const auth = getAuth()

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          pw,
        )

      const firebaseUser = userCredential.user

      const ok = await syncRedisSession(firebaseUser)

      if (!ok) {
        setErr('세션 생성 실패')
        return
      }

      setCurrentUser(firebaseUser)

      setEmail(
        firebaseUser.email?.trim().toLowerCase() ||
          email.trim().toLowerCase(),
      )

      setMessage('VIP 로그인 성공! 이동 중입니다.')

      setTimeout(() => {
        router.replace(`/${locale}/vip/upgrade`)
        router.refresh()
      }, 300)
    } catch (error) {
      if (isExpectedFirebaseLoginError(error)) {
        console.warn('[VIP_LOGIN] expected login failure', {
          code:
            typeof error === 'object' &&
            error !== null &&
            'code' in error
              ? (error as FirebaseLoginError).code
              : undefined,
        })
      } else {
        console.error('[VIP_LOGIN] login failed', error)
      }

      setErr(getVipLoginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setErr(null)
    setMessage(null)
    setLogoutLoading(true)

    try {
      const auth = getAuth()

      await signOut(auth)

      const logoutRes = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!logoutRes.ok) {
        setErr('로그아웃 실패')
        return
      }

      sessionSyncRef.current = null

      setCurrentUser(null)
      setEmail('')
      setPw('')
      setMessage('로그아웃 완료')

      router.refresh()
    } catch (error) {
      console.error('[VIP_LOGIN] logout failed', error)

      setErr('로그아웃 실패')
    } finally {
      setLogoutLoading(false)
    }
  }

  const currentEmail =
    currentUser?.email?.trim().toLowerCase() ||
    email.trim().toLowerCase()

  return (
    <main className="relative min-h-[100svh] overflow-hidden flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(135deg,#020617,#020617_48%,#052e2b)] text-white">
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
        transition={{
          duration: 0.55,
          ease: 'easeOut',
        }}
        className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-[0_0_60px_rgba(16,185,129,0.18)] backdrop-blur-2xl sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-emerald-400/10" />

        <div className="relative mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            VIP LOGIN
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            VIP 로그인
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            VIP 결제 시 생성한 이메일과 비밀번호로
            로그인하세요.
          </p>
        </div>

        {authLoading ? (
          <div className="relative rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-center text-sm text-slate-300">
            로그인 상태 확인 중…
          </div>
        ) : currentUser ? (
          <div className="relative space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                boxShadow: [
                  '0 0 18px rgba(16,185,129,0.14)',
                  '0 0 36px rgba(16,185,129,0.34)',
                  '0 0 18px rgba(16,185,129,0.14)',
                ],
              }}
              transition={{
                opacity: {
                  duration: 0.4,
                  ease: 'easeOut',
                },
                y: {
                  duration: 0.4,
                  ease: 'easeOut',
                },
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-5 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-2xl">
                ✓
              </div>

              <h2 className="text-xl font-extrabold text-emerald-200">
                VIP 로그인 완료
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                현재 VIP 계정으로 로그인되어 있습니다.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                {currentEmail}
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 18,
              }}
              type="button"
              onClick={() => {
                router.replace(`/${locale}/vip/upgrade`)
                router.refresh()
              }}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-emerald-300/30 bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-4 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(16,185,129,0.55)]"
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

              <span className="relative">
                VIP 업그레이드 하기
              </span>
            </motion.button>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                {message}
              </motion.p>
            )}

            {err && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {err}
              </motion.p>
            )}
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="relative space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="vip-email"
                className="text-sm font-medium text-slate-300"
              >
                이메일
              </label>

              <motion.input
                id="vip-email"
                whileFocus={{ scale: 1.015 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)

                  if (err) setErr(null)
                }}
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:bg-black/30 focus:shadow-[0_0_25px_rgba(16,185,129,0.22)]"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="vip-password"
                  className="text-sm font-medium text-slate-300"
                >
                  비밀번호
                </label>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/${locale}/vip/reset-password`)
                  }
                  className="text-xs font-semibold text-emerald-300/90 transition hover:text-emerald-200 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              <div className="relative">
                <motion.input
                  id="vip-password"
                  whileFocus={{ scale: 1.015 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                  }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value)

                    if (err) setErr(null)
                  }}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 pr-12 text-sm text-white outline-none backdrop-blur-md transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:bg-black/30 focus:shadow-[0_0_25px_rgba(16,185,129,0.22)]"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPw((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-300 transition hover:text-white"
                  aria-label={
                    showPw
                      ? '비밀번호 숨기기'
                      : '비밀번호 보기'
                  }
                >
                  👁
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{
                scale: loading ? 1 : 1.025,
                y: loading ? 0 : -2,
              }}
              whileTap={{
                scale: loading ? 1 : 0.96,
              }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 18,
              }}
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-2xl border border-emerald-300/30 bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-4 py-3 text-sm font-bold text-black shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

              <span className="relative flex items-center gap-2">
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                )}

                {loading
                  ? 'VIP 로그인 중…'
                  : 'VIP 로그인'}
              </span>
            </motion.button>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                {message}
              </motion.p>
            )}

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
        )}

        <div className="relative mt-6">
          <motion.button
            whileHover={{
              scale: logoutLoading ? 1 : 1.025,
              y: logoutLoading ? 0 : -2,
            }}
            whileTap={{
              scale: logoutLoading ? 1 : 0.96,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 18,
            }}
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.18)] backdrop-blur-md transition-all duration-300 hover:bg-red-500/25 hover:text-white hover:shadow-[0_0_36px_rgba(239,68,68,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {logoutLoading
              ? '로그아웃 중…'
              : '로그아웃'}
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: [0.8, 1, 0.8],
            y: 0,
            boxShadow: [
              '0 0 18px rgba(250,204,21,0.12)',
              '0 0 34px rgba(250,204,21,0.32)',
              '0 0 18px rgba(250,204,21,0.12)',
            ],
          }}
          transition={{
            opacity: {
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            boxShadow: {
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            y: {
              duration: 0.45,
              ease: 'easeOut',
            },
          }}
          className="relative mt-5 rounded-2xl border border-yellow-300/30 bg-yellow-400/10 px-4 py-3 text-center text-xs font-semibold leading-relaxed text-yellow-200"
        >
          VIP 로그인은 VIP 결제를 완료한 계정으로만
          이용하실수 있습니다.
        </motion.div>
      </motion.div>
    </main>
  )
}
