'use client'

import React from 'react'
import { ActionGateState } from '@/components/system/ActionGateStatus'

import { RiskNumericPanel } from './numeric/RiskNumericPanel'
import { RiskLimitedPanel } from './limited/RiskLimitedPanel'
import { RiskFullPanel } from './full/RiskFullPanel'
import { ActionGateCopy } from './ActionGateCopy'

/* 🔥 NEW */
import { LiveBollingerCommentaryBanner } from '@/components/realtime/LiveBollingerCommentaryBanner'

/**
 * ActionGateRenderer
 *
 * Interpretation Authority Boundary
 * ----------------------------------
 * - 이 컴포넌트는 시스템 전체에서
 *   "해석(interpretation)이 최초로 허용되는 지점"이다.
 */

interface ActionGateRendererProps {
  gate: ActionGateState
}

export const ActionGateRenderer: React.FC<ActionGateRendererProps> = ({
  gate,
}) => {
  /* ======================================================
   * 1️⃣ Container tone (state → color only)
   * ====================================================== */
  const containerClass =
    gate === 'OBSERVE'
      ? 'from-emerald-900/40 to-teal-900/20 border-emerald-700/40 text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
      : gate === 'CAUTION'
      ? 'from-amber-900/30 to-yellow-900/20 border-amber-700/40 text-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
      : 'from-slate-900/60 to-neutral-900/40 border-slate-700/40 text-slate-300 shadow-[0_0_30px_rgba(100,116,139,0.12)]'

  const railClass =
    gate === 'OBSERVE'
      ? 'bg-emerald-400/40'
      : gate === 'CAUTION'
      ? 'bg-amber-400/40'
      : 'bg-slate-400/30'

  /* ======================================================
   * 2️⃣ Background animation (UI-only)
   * ====================================================== */
  const bgMotionClass: Partial<Record<ActionGateState, string>> = {
    OBSERVE: 'ag-bg-observe',
    CAUTION: 'ag-bg-caution',
    IGNORE: 'ag-bg-ignore',
  }

  /* ======================================================
   * 3️⃣ Visual density (state-based, UI-only)
   * ====================================================== */
  const densityClass: Partial<Record<ActionGateState, string>> = {
    OBSERVE: 'ag-density-open',
    CAUTION: 'ag-density-medium',
    IGNORE: 'ag-density-compact',
  }

  return (
    <div
      className={`
        relative
        w-full
        flex
        items-stretch
        border-b
        bg-gradient-to-r
        backdrop-blur-md
        overflow-hidden
        transition-all duration-500 ease-out
        ${containerClass}
        ${densityClass[gate]}
      `}
    >
      {/* Animated Background Layer */}
      <div
        aria-hidden
        className={`
          absolute inset-0
          pointer-events-none
          transition-opacity duration-500 ease-out
          ${bgMotionClass[gate] ?? 'ag-bg-default'}
        `}
      />

      {/* Left System Rail */}
      <div
        className={`
          relative z-10
          w-[4px]
          shrink-0
          ${railClass}
        `}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full flex flex-col justify-center">
        {/* 🔓 Interpretation Entry Point */}
        <ActionGateCopy gate={gate} />

        {/* 🔥 Live Bollinger Commentary (ActionGate와 무관) */}
        <LiveBollingerCommentaryBanner />

        {/* Structural Detail Panels */}
        <div className="mt-3">
          {gate === 'IGNORE' && <RiskNumericPanel />}
          {gate === 'CAUTION' && <RiskLimitedPanel />}
          {gate === 'OBSERVE' && <RiskFullPanel />}
        </div>
      </div>
    </div>
  )
}
