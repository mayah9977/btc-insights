'use client';

import { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';

import { useWhaleHistory } from '../lib/whaleHistoryStore';
import { useWhaleTrigger } from '../lib/whaleTriggerStore';
import { useWhaleCooldown } from '../lib/whaleCooldown';

import { calcEntryFailureProbability } from '../lib/entryFailureProbability';
import type { VIPLevel } from '../lib/vipProbabilityCurve';

import { getDangerThreshold } from '../lib/vipDangerThreshold';
import { useDangerZoneLog } from '../lib/dangerZoneLogStore';
import { useWhaleHeatmapFocus } from '../lib/whaleHeatmapFocusStore';
import { useVIPNotification } from '../lib/vipNotificationStore';
import { playVIPRiskSound } from '../lib/vipRiskSound';

import { POLICY } from 'lib/policy/switch';

import AIScoreRing from './AIScoreRing';
import VIPRiskMeter from './VIPRiskMeter';

type Props = {
  symbol: string;
  aiScore: number;
  vipLevel: VIPLevel; // FREE | VIP1 | VIP2 | VIP3
};

export default function CoinCard({
  symbol,
  aiScore,
  vipLevel,
}: Props) {
  const { logs } = useWhaleHistory();
  const { whaleActive, triggerWhale } = useWhaleTrigger();
  const { remainingMs, cooldownMs, triggerCooldown } =
    useWhaleCooldown(symbol);

  const { push: pushDangerLog } = useDangerZoneLog();
  const { setSymbol: focusHeatmap } = useWhaleHeatmapFocus();
  const { push: pushVIPNotify } = useVIPNotification();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dangerEnteredRef = useRef(false);

  const isVIP = vipLevel !== 'FREE';
  const dangerThreshold = getDangerThreshold(vipLevel);

  /* =========================
     EXTREME MODE 판정
  ========================= */
  const extreme = useMemo(() => {
    let streak = 0;
    for (const l of logs) {
      if (l.symbol !== symbol) continue;
      if (l.intensity === 'HIGH') {
        streak++;
        if (streak >= 3) return true;
      } else {
        break;
      }
    }
    return false;
  }, [logs, symbol]);

  /* =========================
     VIP 레벨 반영 실패 확률
  ========================= */
  const failureProb = useMemo(
    () =>
      calcEntryFailureProbability({
        aiScore,
        cooldownMs,
        extreme,
        vipLevel,
      }),
    [aiScore, cooldownMs, extreme, vipLevel]
  );

  /* =========================
     Danger Zone 진입 처리
     (Policy + VIP Threshold)
  ========================= */
  useEffect(() => {
    if (
      POLICY.enableExtremeVisuals &&
      failureProb >= dangerThreshold &&
      !dangerEnteredRef.current
    ) {
      dangerEnteredRef.current = true;

      // 🐋 WhaleBanner 동기화
      triggerWhale({ intensity: 'HIGH' });

      // 🗺 Heatmap 포커스
      focusHeatmap(symbol);

      // 📝 로그 저장
      pushDangerLog({
        symbol,
        probability: failureProb,
        ts: Date.now(),
      });

      // 👑 VIP 알림 + 사운드
      if (isVIP) {
        pushVIPNotify({
          id: crypto.randomUUID(),
          priority: 'HIGH',
          message: `⚠️ ${symbol} Risk Increased (${vipLevel})`,
          ts: Date.now(),
          symbol,
        });

        if (POLICY.enableSound) {
          playVIPRiskSound(failureProb);
        }
      }
    }

    if (failureProb < dangerThreshold) {
      dangerEnteredRef.current = false;
    }
  }, [
    failureProb,
    dangerThreshold,
    symbol,
    vipLevel,
    isVIP,
    triggerWhale,
    focusHeatmap,
    pushDangerLog,
    pushVIPNotify,
  ]);

  /* =========================
     EXTREME 사운드 / 진동
     (Policy Switch)
  ========================= */
  useEffect(() => {
    if (extreme && POLICY.enableSound) {
      audioRef.current?.play().catch(() => {});
    }
    if (extreme && POLICY.enableVibration) {
      navigator.vibrate?.([200, 100, 200, 100, 400]);
    }
  }, [extreme]);

  /* =========================
     Cooldown Progress
  ========================= */
  const progress =
    cooldownMs > 0
      ? 1 - remainingMs / cooldownMs
      : 1;

  const canEntry =
    isVIP &&
    whaleActive &&
    remainingMs === 0 &&
    POLICY.enableEntryUI;

  return (
    <div
      id={`coin-${symbol}`}
      className={clsx(
        'relative rounded-xl border p-4 transition-all bg-neutral-900',
        whaleActive &&
          POLICY.enableExtremeVisuals &&
          'border-red-500',
        extreme &&
          POLICY.enableExtremeVisuals &&
          'scale-105 animate-pulse shadow-[0_0_40px_rgba(239,68,68,1)]'
      )}
    >
      <audio
        ref={audioRef}
        src="/sounds/extreme.mp3"
        preload="auto"
      />

      {extreme && POLICY.enableExtremeVisuals && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-black text-xs font-extrabold px-2 py-1 rounded">
          EXTREME
        </div>
      )}

      <h3 className="text-lg font-bold mb-2">
        {symbol}
      </h3>

      {/* AI Score + Cooldown Ring */}
      <div className="flex justify-center mb-3">
        <AIScoreRing
          score={aiScore}
          progress={progress}
          mode={remainingMs > 0 ? 'cooldown' : 'normal'}
          highlight={
            extreme && POLICY.enableExtremeVisuals
          }
          failureProb={failureProb}
          vip={isVIP}
        />
      </div>

      {/* 👑 VIP Risk Meter */}
      {isVIP && POLICY.enableRiskMeter && (
        <VIPRiskMeter probability={failureProb} />
      )}

      {/* ENTRY 버튼 */}
      <button
        onClick={() => {
          if (canEntry) triggerCooldown(1, extreme);
        }}
        disabled={!canEntry}
        className={clsx(
          'w-full rounded-lg py-2 font-bold mt-3',
          canEntry
            ? 'bg-red-500 text-white'
            : 'bg-neutral-700 text-neutral-400'
        )}
      >
        {POLICY.entryLabelSafe ? '신호 확인' : 'ENTRY'}
      </button>

      {/* 📜 Store 모드 고지 */}
      {POLICY.disclaimerRequired && (
        <p className="mt-2 text-xs text-neutral-400">
          본 정보는 투자 또는 거래를 권유하지 않으며,
          참고용 시각화 데이터입니다.
        </p>
      )}
    </div>
  );
}
