// app/[locale]/vip/reset-password/page.tsx

'use client'

import React, { useMemo, useState } from 'react'
import {
  getAuth,
  sendPasswordResetEmail,
  type ActionCodeSettings,
} from 'firebase/auth'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import '@/lib/firebase/client'

const FIREBASE_RESET_ERROR_MAP: Record<string, string> = {
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/user-not-found':
    '해당 이메일로 가입된 VIP 계정을 찾을 수 없습니다.',
  'auth/missing-email': '이메일을 입력해주세요.',
  'auth/too-many-requests':
    '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed':
    '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
  'auth/unauthorized-continue-uri':
    'Firebase Authorized domains에 현재 도메인을 추가해주세요.',
  'auth/invalid-continue-uri':
    '비밀번호 재설정 이동 주소가 올바르지 않습니다.',
}

function mapResetError(error: unknown) {
  const e = error as {
    code?: string
    message?: string
  }

  if (e?.code && FIREBASE_RESET_ERROR_MAP[e.code]) {
    return FIREBASE_RESET_ERROR_MAP[e.code]
  }

  return '비밀번호 재설정 메일 발송에 실패했습니다.'
}

export default function VIPResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()

  const locale = useMemo(() => {
    return typeof params?.locale === 'string' ? params.locale : 'ko'
  }, [params])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setErr(null)
    setMessage(null)
    setSent(false)

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErr('이메일을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const auth = getAuth()

      /**
       * Firebase hosted password reset UI를 한국어로 표시하기 위한 설정.
       * Firebase Console의 Password reset template 언어도 Korean으로 설정하세요.
       */
      auth.languageCode = 'ko'

      const origin = window.location.origin

      /**
       * 안정화 최종 구조:
       * Firebase hosted reset UI를 사용하고,
       * 비밀번호 변경 완료 후 앱 로그인 페이지로 돌아오도록 continueUrl만 지정.
       *
       * custom /vip/reset-confirm flow는 사용하지 않음.
       */
      const continueUrl = `${origin}/${locale}/vip-login`

      const actionCodeSettings: ActionCodeSettings = {
        url: continueUrl,

        /**
         * Firebase hosted password reset UI 유지.
         * oobCode를 앱에서 직접 처리하지 않음.
         */
        handleCodeInApp: false,
      }

      console.log('[VIP_RESET_PASSWORD] send reset email start', {
        email: normalizedEmail,
        continueUrl,
        actionCodeSettings,
      })

      await sendPasswordResetEmail(
        auth,
        normalizedEmail,
        actionCodeSettings,
      )

      setSent(true)
      setMessage(
        '비밀번호 재설정 메일을 발송했습니다. 이메일함의 재설정 버튼을 눌러 새 비밀번호를 설정해주세요.',
      )
    } catch (error) {
      console.error('[VIP_RESET_PASSWORD] failed', error)
      setErr(mapResetError(error))
    } finally {
      setLoading(false)
    }
  }

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
            PASSWORD RESET
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            비밀번호 재설정
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            VIP 계정 이메일을 입력하면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={onSubmit} className="relative space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="vip-reset-email"
              className="text-sm font-medium text-slate-300"
            >
              이메일
            </label>

            <motion.input
              id="vip-reset-email"
              whileFocus={{ scale: 1.015 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              type="email"
              placeholder="VIP 계정 이메일을 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)

                if (err) setErr(null)
                if (message) setMessage(null)
                if (sent) setSent(false)
              }}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="send"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:bg-black/30 focus:shadow-[0_0_25px_rgba(16,185,129,0.22)]"
              required
            />
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

              {loading ? '메일 발송 중…' : '재설정 메일 보내기'}
            </span>
          </motion.button>

          {message && (
            <motion.div
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              <div className="font-bold">메일 발송 완료</div>

              <p className="mt-1 text-xs leading-relaxed text-emerald-200/90">
                {message}
              </p>
            </motion.div>
          )}

          {err && (
            <motion.p
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {err}
            </motion.p>
          )}
        </form>

        <div className="relative mt-6">
          <motion.button
            whileHover={{
              scale: 1.025,
              y: -2,
            }}
            whileTap={{
              scale: 0.96,
            }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 18,
            }}
            type="button"
            onClick={() => router.replace(`/${locale}/vip-login`)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 shadow-[0_0_24px_rgba(16,185,129,0.10)] backdrop-blur-md transition-all duration-300 hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-white"
          >
            VIP 로그인으로 돌아가기
          </motion.button>
        </div>

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
            y: 0,
            boxShadow: [
              '0 0 18px rgba(16,185,129,0.10)',
              '0 0 34px rgba(16,185,129,0.24)',
              '0 0 18px rgba(16,185,129,0.10)',
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
          className="relative mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-center text-xs font-semibold leading-relaxed text-emerald-200"
        >
          메일이 보이지 않으면 스팸함 또는 프로모션함도 확인해주세요.
        </motion.div>
      </motion.div>
    </main>
  )
}
