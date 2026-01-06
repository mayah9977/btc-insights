'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PriceAlert } from '@/lib/alerts/alertStore.client'
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
  const [percent, setPercent] = useState<number>(alertData.percent ?? 1)
  const [repeatMode, setRepeatMode] = useState(alertData.repeatMode)
  const [cooldownMin, setCooldownMin] = useState<number>(
    Math.round((alertData.cooldownMs ?? 0) / 60000) || 10,
  )
  const [enabled, setEnabled] = useState<boolean>(!!alertData.enabled)
  const [memo, setMemo] = useState<string>((alertData as any).memo ?? '')

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
        enabled,
        memo: memo?.trim() || undefined,
        cooldownMs,
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

      // ✅ 핵심: PATCH 결과를 store에 즉시 반영
      const updated: PriceAlert = await res.json()
      upsertAlert(updated)

      onSaved()
      onClose()
    } catch (e) {
      console.error(e)
      window.alert('알림 수정에 실패했습니다. 콘솔을 확인하세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center p-6 pt-20">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F1A]/95 shadow-2xl">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-lg font-semibold text-slate-100">
              알림 수정
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {alertData.id}
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <Field label="활성화">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                />
                Enabled
              </label>
            </Field>

            <Field label="심볼">
              <input
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
              />
            </Field>

            <Field label="알림 조건">
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
              >
                <option value="ABOVE">가격 이상 상승</option>
                <option value="BELOW">가격 이하 하락</option>
                <option value="PERCENT_UP">현재가 대비 % 이상 상승</option>
                <option value="PERCENT_DOWN">현재가 대비 % 이상 하락</option>
              </select>
            </Field>

            {(condition === 'ABOVE' || condition === 'BELOW') && (
              <Field label="기준 가격">
                <input
                  type="number"
                  value={targetPrice}
                  onChange={e => setTargetPrice(Number(e.target.value))}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
                />
              </Field>
            )}

            {(condition === 'PERCENT_UP' ||
              condition === 'PERCENT_DOWN') && (
              <Field label="변동률(%)">
                <input
                  type="number"
                  value={percent}
                  onChange={e => setPercent(Number(e.target.value))}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
                />
              </Field>
            )}

            <Field label="알림 주기">
              <select
                value={repeatMode}
                onChange={e => setRepeatMode(e.target.value as any)}
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
              >
                <option value="ONCE">1회</option>
                <option value="REPEAT">반복</option>
              </select>
            </Field>

            {repeatMode === 'REPEAT' && (
              <Field label="쿨다운(분)">
                <input
                  type="number"
                  value={cooldownMin}
                  onChange={e => setCooldownMin(Number(e.target.value))}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
                />
              </Field>
            )}

            <Field label="메모(선택)">
              <input
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-slate-100 outline-none focus:border-white/25"
              />
            </Field>
          </div>

          <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
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
    <div className="space-y-1">
      <div className="text-xs text-slate-300">{label}</div>
      {children}
    </div>
  )
}
