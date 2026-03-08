'use client'

import { useMasterMarketStore } from './masterMarketStore'

export const useActionGate = () =>
  useMasterMarketStore((s) => s.actionGate)

export const useDecision = () =>
  useMasterMarketStore((s) => s.decision)

export const useDominant = () =>
  useMasterMarketStore((s) => s.dominant)

export const useConfidence = () =>
  useMasterMarketStore((s) => s.confidence)

export const useMACD = () =>
  useMasterMarketStore((s) => s.macd)

export const useSymbol = () =>
  useMasterMarketStore((s) => s.symbol)
