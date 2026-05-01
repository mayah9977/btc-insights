'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'
import { useAlertsStore } from '../providers/alertsStore.zustand'

type Props = {
  alert: PriceAlert
  onClose: () => void
  onSaved: () => void
}

export default function AlertEditModal({
  alert: alertData,
  onClose,
  onSaved,
}: Props) {
  const upsertAlert = useAlertsStore(s => s.upsertAlert)
  const [loading, setLoading] = useState(false)

  const [symbol, setSymbol] = useState(alertData.symbol)
  const [condition, setCondition] = useState(alertData.condition)
  const [targetPrice, setTargetPrice] = useState<number>(
    alertData.targetPrice ?? 68000,
  )
  const [targetPriceInput, setTargetPriceInput] = useState<string>(
    alertData.targetPrice ? String(alertData.targetPrice) : '',
  )
  const [percent, setPercent] = useState<number>(
    alertData.percent ?? 1,
  )
  const [repeatMode, setRepeatMode] = useState(alertData.repeatMode)
  const [cooldownMin, setCooldownMin] = useState<number>(
    Math.round((alertData.cooldownMs ?? 0) / 60000) || 10,
  )
  const [status, setStatus] = useState(alertData.status)
  const [memo, setMemo] = useState(alertData.memo ?? '')

  const cooldownMs = useMemo(() => {
    if (repeatMode === 'ONCE') return 0
    return Math.max(0, cooldownMin) * 60 * 1000
  }, [repeatMode, cooldownMin])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function submit() {
    if (loading) return
    setLoading(true)

    try {
      const body: any = {
        symbol,
        condition,
        repeatMode,
        cooldownMs,
        status,
        memo: memo?.trim() || undefined,
      }

      if (condition === 'ABOVE' || condition === 'BELOW') {
        body.targetPrice = Number(targetPrice)
      } else {
        body.percent = Number(percent)
      }

      const res = await fetch(`/api/alerts/${alertData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Update failed')

      const updated: PriceAlert = await res.json()
      upsertAlert(updated)

      onSaved()
      onClose()
    } catch (e) {
      console.error(e)
      window.alert('알림 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto px-4 py-6 sm:p-6 sm:pt-20">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827]/95 via-[#0B0F1A]/95 to-black/95 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_45%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_40%)]" />
            <div className="relative">
              <div className="text-lg font-semibold tracking-tight text-slate-100">
                알림 수정
              </div>
              <div className="mt-1 text-xs leading-relaxed text-slate-400">
                가격 조건과 알림 동작을 조정하세요.
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </div>

              <div className="space-y-4">
                <Field label="상태">
                  <select
                    value={status}
                    onChange={e =>
                      setStatus(e.target.value as any)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="WAITING">활성</option>
                    <option value="DISABLED">비활성</option>
                  </select>
                </Field>

                <Field label="심볼">
                  <input
                    value={symbol}
                    onChange={e =>
                      setSymbol(e.target.value.toUpperCase())
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Trigger
              </div>

              <div className="space-y-4">
                <Field label="알림 조건">
                  <select
                    value={condition}
                    onChange={e =>
                      setCondition(e.target.value as any)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ABOVE">가격 이상</option>
                    <option value="BELOW">가격 이하</option>
                    <option value="PERCENT_UP">% 상승</option>
                    <option value="PERCENT_DOWN">% 하락</option>
                  </select>
                </Field>

                {(condition === 'ABOVE' ||
                  condition === 'BELOW') && (
                  <Field label="기준 가격">
                    <input
                      type="number"
                      value={targetPriceInput}
                      onChange={e =>
                        setTargetPriceInput(e.target.value)
                      }
                      onBlur={() => {
                        if (targetPriceInput.trim() === '') return
                        setTargetPrice(Number(targetPriceInput))
                      }}
                      placeholder="예: 68000"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                )}

                {(condition === 'PERCENT_UP' ||
                  condition === 'PERCENT_DOWN') && (
                  <Field label="변동률 (%)">
                    <input
                      type="number"
                      value={percent}
                      onChange={e =>
                        setPercent(Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Behavior
              </div>

              <div className="space-y-4">
                <Field label="알림 주기">
                  <select
                    value={repeatMode}
                    onChange={e =>
                      setRepeatMode(e.target.value as any)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ONCE">1회</option>
                    <option value="REPEAT">반복</option>
                  </select>
                </Field>

                {repeatMode === 'REPEAT' && (
                  <Field label="쿨다운 (분)">
                    <input
                      type="number"
                      value={cooldownMin}
                      onChange={e =>
                        setCooldownMin(Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                )}

                <Field label="메모">
                  <input
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="선택 사항"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/70 focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '저장중…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-slate-300">{label}</div>
      {children}
    </div>
  )
}
