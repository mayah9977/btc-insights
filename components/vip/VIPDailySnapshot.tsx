'use client'

import { useVipJudgementStore } from '@/lib/vip/judgementStore'
import { useVipHistoryStore } from '@/lib/vip/historyStore'
import { useVipDailySnapshot } from '@/lib/vip/snapshot/useVipDailySnapshot'

export default function VIPDailySnapshot() {
  const { judgmentSentence, confidence } = useVipJudgementStore()
  const { todayAvoidedLossPercent } = useVipHistoryStore()
  const { capture } = useVipDailySnapshot()

  if (!judgmentSentence) return null

  return (
    <>
      {/* 실제 캡처 영역 */}
      <section
        id="vip-daily-snapshot"
        className="rounded-2xl border border-vipBorder bg-vipCard p-6 space-y-4"
      >
        <div className="text-xs tracking-widest uppercase text-zinc-400">
          VIP Daily Snapshot
        </div>

        <div className="text-lg font-bold text-white">
          {judgmentSentence}
        </div>

        <div className="text-sm text-zinc-400">
          판단 신뢰도:{' '}
          <b className="text-zinc-200">
            {(confidence * 100).toFixed(1)}%
          </b>
        </div>

        {typeof todayAvoidedLossPercent === 'number' && (
          <div className="text-sm text-zinc-400">
            오늘 회피한 위험:{' '}
            <b className="text-emerald-400">
              {todayAvoidedLossPercent.toFixed(1)}%
            </b>
          </div>
        )}

        <div className="text-xs text-zinc-500">
          {new Date().toLocaleDateString()}
        </div>
      </section>

      {/* 액션 */}
      <button
        onClick={() => capture('vip-daily-snapshot')}
        className="mt-3 w-full rounded-xl bg-vipAccent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
      >
        📸 오늘 판단 저장하기
      </button>
    </>
  )
}
