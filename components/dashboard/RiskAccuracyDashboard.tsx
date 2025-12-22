'use client'

import { analyzeRiskPnLCorrelation } from '@/lib/analysis/riskPnlCorrelation'

function score(avgPnL: number) {
  if (avgPnL > 0) return 'GOOD'
  if (avgPnL > -50) return 'NEUTRAL'
  return 'BAD'
}

export function RiskAccuracyDashboard() {
  const stats = analyzeRiskPnLCorrelation()

  return (
    <div className="border rounded-xl p-4 space-y-2">
      <h2 className="font-semibold text-sm">
        Risk Prediction Accuracy
      </h2>

      {(['LOW', 'MEDIUM', 'HIGH'] as const).map(
        (level) => (
          <div
            key={level}
            className="flex justify-between text-sm"
          >
            <span>{level} Risk</span>
            <span>
              Avg PnL:{' '}
              <strong>
                {stats[level].avgPnL.toFixed(2)}
              </strong>{' '}
              (
              {score(stats[level].avgPnL)}
              )
            </span>
          </div>
        )
      )}

      <p className="text-xs text-gray-400">
        Positive Avg PnL indicates correct risk
        anticipation.
      </p>
    </div>
  )
}
