import { VIPLevel, getVipProbabilityCurve } from './vipProbabilityCurve';

type Params = {
  aiScore: number;
  cooldownMs: number;
  extreme: boolean;
  vipLevel: VIPLevel;
};

/**
 * ENTRY 실패 확률 (0 ~ 1)
 *
 * 계산 순서:
 * 1. 기본 리스크(base) 산출
 * 2. VIP 레벨별 확률 곡선 적용
 */
export function calcEntryFailureProbability({
  aiScore,
  cooldownMs,
  extreme,
  vipLevel,
}: Params): number {
  let base = 0;

  /* =========================
     AI 점수 리스크
  ========================= */
  if (aiScore < 40) base += 0.35;
  else if (aiScore < 60) base += 0.2;
  else if (aiScore < 75) base += 0.1;

  /* =========================
     쿨다운 리스크
  ========================= */
  if (cooldownMs > 0) base += 0.25;

  /* =========================
     EXTREME 리스크
  ========================= */
  if (extreme) base += 0.35;

  base = Math.min(1, base);

  /* =========================
     👑 VIP 확률 곡선 적용
  ========================= */
  return getVipProbabilityCurve(base, vipLevel);
}
