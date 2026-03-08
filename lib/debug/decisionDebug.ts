import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'

export function debugDecision(
  input: any,
  result: FinalDecision
): void {

  console.log("----- DECISION DEBUG -----")

  console.log("bollinger:", input?.bollingerSignal)
  console.log("macd:", input?.macd?.cross)
  console.log("fmai:", input?.fmai?.direction)
  console.log("prob:", input?.probability)

  console.log("gate:", input?.actionGateState)

  console.log("result:", result)

}
