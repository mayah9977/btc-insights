import { notifyVipUpgrade } from '@/lib/vip/vipNotifier'
import { useVipRiskHistoryStore } from '@/lib/vip/riskHistoryStore'
import { useVipJudgementStore } from '@/lib/vip/judgementStore'
import { generateRiskSentence } from '@/lib/vip/riskSentence'

export function handleRiskUpdate(data: {
  riskLevel: any
  ts: number
}) {
  const sentence = generateRiskSentence(data.riskLevel)
  const time = new Date(data.ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const riskStore = useVipRiskHistoryStore.getState()
  const judgementStore = useVipJudgementStore.getState()

  riskStore.append({
    level: data.riskLevel,
    reason: sentence,
    time,
  })

  judgementStore.setJudgement({
    sentence,
    confidence:
      data.riskLevel === 'LOW'
        ? 0.9
        : data.riskLevel === 'MEDIUM'
        ? 0.8
        : data.riskLevel === 'HIGH'
        ? 0.75
        : 0.7,
  })

  judgementStore.append({
    time,
    state:
      data.riskLevel === 'EXTREME'
        ? '리스크 급등'
        : data.riskLevel === 'HIGH'
        ? '리스크 상승'
        : data.riskLevel === 'MEDIUM'
        ? '변동성 증가'
        : '시장 안정',
    note: sentence,
  })
}
