// lib/market/institutional/realtimeInstitutionalPatternStore.ts

'use client'

import { create } from 'zustand'

import type {
  InstitutionalLatestEvaluation,
  InstitutionalReadyPatternPresentation,
} from '@/lib/market/institutional/institutionalLatestEvaluation'

export type RealtimeInstitutionalPatternSource =
  | 'CANONICAL_SSE'
  | 'CANONICAL_BOOTSTRAP'

export type RealtimeInstitutionalPattern =
  Readonly<{
    source:
      RealtimeInstitutionalPatternSource
    readyPattern:
      InstitutionalReadyPatternPresentation
    confirmedCandleTs: number
    ts: number
  }>

export type InstitutionalLiveReadySignalInput =
  Readonly<{
    readyPattern:
      | InstitutionalReadyPatternPresentation
      | null
    confirmedCandleTs: number
    ts: number
  }>

export type InstitutionalBootstrapEvaluationInput =
  Readonly<{
    latestEvaluation:
      | InstitutionalLatestEvaluation
      | null
    snapshot30mConfirmedCandleTs:
      | number
      | null
    ts: number
  }>

type RealtimeInstitutionalPatternState = {
  pattern:
    | RealtimeInstitutionalPattern
    | null

  latestEvaluationConfirmedCandleTs:
    | number
    | null

  applyLiveReadySignal: (
    input:
      InstitutionalLiveReadySignalInput,
  ) => void

  applyBootstrapEvaluation: (
    input:
      InstitutionalBootstrapEvaluationInput,
  ) => void

  clearPattern: () => void
}

function isFiniteTimestamp(
  value: number | null,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

export const useRealtimeInstitutionalPatternStore =
  create<RealtimeInstitutionalPatternState>(
    (set, get) => ({
      pattern: null,

      latestEvaluationConfirmedCandleTs:
        null,

      applyLiveReadySignal: ({
        readyPattern,
        confirmedCandleTs,
        ts,
      }) => {
        if (
          !isFiniteTimestamp(
            confirmedCandleTs,
          )
        ) {
          return
        }

        const state = get()

        const currentTs =
          state
            .latestEvaluationConfirmedCandleTs

        if (
          currentTs !== null &&
          currentTs > confirmedCandleTs
        ) {
          return
        }

        if (
          currentTs ===
          confirmedCandleTs
        ) {
          if (
            readyPattern === null
          ) {
            return
          }

          if (
            state.pattern !== null &&
            state.pattern.confirmedCandleTs ===
              confirmedCandleTs
          ) {
            return
          }
        }

        set({
          latestEvaluationConfirmedCandleTs:
            confirmedCandleTs,

          pattern:
            readyPattern === null
              ? null
              : {
                  source:
                    'CANONICAL_SSE',

                  readyPattern,

                  confirmedCandleTs,

                  ts,
                },
        })
      },

      applyBootstrapEvaluation: ({
        latestEvaluation,
        snapshot30mConfirmedCandleTs,
        ts,
      }) => {
        const state = get()

        const currentTs =
          state
            .latestEvaluationConfirmedCandleTs

        const snapshot30mTs =
          isFiniteTimestamp(
            snapshot30mConfirmedCandleTs,
          )
            ? snapshot30mConfirmedCandleTs
            : null

        const evaluationTs =
          latestEvaluation
            ?.confirmedCandleTs ??
          null

        if (
          snapshot30mTs !== null &&
          (
            evaluationTs === null ||
            snapshot30mTs >
              evaluationTs
          )
        ) {
          if (
            currentTs === null ||
            snapshot30mTs >
              currentTs
          ) {
            set({
              latestEvaluationConfirmedCandleTs:
                snapshot30mTs,

              pattern: null,
            })
          }

          return
        }

        if (
          latestEvaluation === null
        ) {
          return
        }

        if (
          currentTs !== null &&
          currentTs >
            latestEvaluation
              .confirmedCandleTs
        ) {
          return
        }

        if (
          currentTs ===
          latestEvaluation
            .confirmedCandleTs
        ) {
          if (
            latestEvaluation.status ===
              'READY' &&
            (
              state.pattern === null ||
              state.pattern
                .confirmedCandleTs !==
                latestEvaluation
                  .confirmedCandleTs
            )
          ) {
            set({
              pattern: {
                source:
                  'CANONICAL_BOOTSTRAP',

                readyPattern:
                  latestEvaluation
                    .readyPattern,

                confirmedCandleTs:
                  latestEvaluation
                    .confirmedCandleTs,

                ts,
              },
            })
          }

          return
        }

        set({
          latestEvaluationConfirmedCandleTs:
            latestEvaluation
              .confirmedCandleTs,

          pattern:
            latestEvaluation.status ===
            'READY'
              ? {
                  source:
                    'CANONICAL_BOOTSTRAP',

                  readyPattern:
                    latestEvaluation
                      .readyPattern,

                  confirmedCandleTs:
                    latestEvaluation
                      .confirmedCandleTs,

                  ts,
                }
              : null,
        })
      },

      clearPattern: () => {
        set({
          pattern: null,
        })
      },
    }),
  )
  