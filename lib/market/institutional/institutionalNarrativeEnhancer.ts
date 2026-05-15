// lib/market/institutional/institutionalNarrativeEnhancer.ts

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

export function buildInstitutionalNarrative(
  snapshot:
    | InstitutionalEvidenceSnapshot
    | null,
): string[] {
  if (!snapshot) return []

  /**
   * Enhancer narrative layer intentionally suppressed.
   *
   * Important:
   * - DO NOT remove enhancer pipeline
   * - DO NOT remove finalized analysis
   * - DO NOT modify ENUM logic
   * - DO NOT modify confidence/hysteresis
   * - DO NOT modify caller structure
   * - DO NOT modify architecture
   *
   * Core finalized analysis is generated separately.
   * This enhancer layer previously appended verbose
   * institutional commentary into Finalized Data Analysis UI.
   *
   * Suppressed narrative categories:
   * - Funding enhancer commentary
   * - Whale pressure commentary
   * - Volume expansion commentary
   * - Weak trading volume commentary
   * - FMAI commentary
   * - OI reinforcement commentary
   * - Divergence commentary
   * - Absorption commentary
   * - Sweep commentary
   * - Macro trend reinforcement narrative
   * - "The 30-minute cumulative..." narrative series
   *
   * Goal:
   * Maintain compact finalized analysis UI
   * without affecting core signal summary pipeline.
   */

  const lines: string[] = []

  return lines
}
