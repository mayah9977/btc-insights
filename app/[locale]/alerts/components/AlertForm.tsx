'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { AlertCondition, RepeatMode } from '@/lib/alerts/alertStore.client'

type Props = {
  initial?: any
  onSubmit: (data: any) => Promise<void>

  /** 강제 센터 모달 (기본 true) */
  forceCenterModal?: boolean

  /** ESC / 닫기 */
  onClose?: () => void
}

export default function AlertForm({
  initial = {},
  onSubmit,
  forceCenterModal = true,
  onClose,
}: Props) {
  const [symbol, setSymbol] = useState(initial.symbol ?? 'BTCUSDT')
  const [condition, setCondition] = useState<AlertCondition>(
    initial.condition ?? 'ABOVE',
  )
  const [targetPrice, setTargetPrice] = useState(initial.targetPrice ?? '')
  const [percent, setPercent] = useState(initial.percent ?? '')
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(
    initial.repeatMode ?? 'ONCE',
  )
  const [cooldownMs] = useState(initial.cooldownMs ?? 300000)
  const [memo, setMemo] = useState(initial.memo ?? '')
  const [submitting, setSubmitting] = useState(false)

  const isPercent =
    condition === 'PERCENT_UP' || condition === 'PERCENT_DOWN'

  // ESC 닫기
  useEffect(() => {
    if (!forceCenterModal || !onClose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [forceCenterModal, onClose])

  async function submit() {
    if (submitting) return
    setSubmitting(true)

    try {
      await onSubmit({
        symbol: symbol.toUpperCase(),
        condition,
        targetPrice: !isPercent
          ? Number(targetPrice) || undefined
          : undefined,
        percent: isPercent ? Number(percent) || undefined : undefined,
        repeatMode,
        cooldownMs,
        memo,
      })
    } catch (e) {
      console.error(e)
      alert('알림 생성에 실패했습니다.')
    } finally {
      setSubmitting(false) // ✅ 중요
    }
  }

  const card = (
    <div className="w-full max-w-[560px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1424] via-[#0c1020] to-[#070b14] p-8 shadow-[0_0_80px_rgba(56,189,248,0.18)]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-white tracking-wide">
            지정가 알림 추가
          </div>
          <div className="mt-1 text-sm text-slate-400">
            가격 도달 또는 변동 시 즉시 알림
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            닫기
          </button>
        )}
      </div>

      {/* Form */}
      <div className="space-y-5">
        <Field label="심볼">
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="알림 조건">
          <select
            value={condition}
            onChange={e =>
              setCondition(e.target.value as AlertCondition)
            }
            className={inputClass}
          >
            <optgroup label="가격 기준">
              <option value="ABOVE">📈 가격 이상 상승</option>
              <option value="BELOW">📉 가격 이하 하락</option>
            </optgroup>
            <optgroup label="변동률 기준">
              <option value="PERCENT_UP">🚀 % 이상 상승</option>
              <option value="PERCENT_DOWN">🔻 % 이상 하락</option>
            </optgroup>
          </select>
        </Field>

        <Field label={isPercent ? '변동률 (%)' : '기준 가격'}>
          <input
            type="number"
            step={isPercent ? 0.1 : 1}
            value={isPercent ? percent : targetPrice}
            onChange={e =>
              isPercent
                ? setPercent(e.target.value)
                : setTargetPrice(e.target.value)
            }
            placeholder={isPercent ? '예: 3' : '예: 68000'}
            className={inputClass}
          />
        </Field>

        <Field label="알림 주기">
          <select
            value={repeatMode}
            onChange={e =>
              setRepeatMode(e.target.value as RepeatMode)
            }
            className={inputClass}
          >
            <option value="ONCE">1회</option>
            <option value="REPEAT">반복</option>
          </select>
        </Field>

        <Field label="메모 (선택)">
          <input
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="예: 급등 초기 구간"
            className={inputClass}
          />
        </Field>

        {/* ✅ 버튼 UX 개선 */}
        <button
          onClick={submit}
          disabled={submitting}
          className={clsx(
            'w-full rounded-xl py-3 font-semibold shadow-lg transition',
            submitting
              ? 'bg-zinc-700 text-zinc-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-vipAccent to-indigo-500 text-black hover:brightness-110',
          )}
        >
          {submitting ? '저장 중…' : '알림 생성'}
        </button>
      </div>
    </div>
  )

  if (forceCenterModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative px-4">{card}</div>
      </div>
    )
  }

  return <div className="space-y-6">{card}</div>
}

/* =========================
 * UI Helpers
 * ========================= */

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 tracking-wide">
        {label}
      </div>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl bg-[#0a0d14] border border-white/15 px-4 py-3 text-white ' +
  'placeholder-slate-500 focus:outline-none focus:border-vipAccent ' +
  'focus:ring-2 focus:ring-vipAccent/30 transition'
