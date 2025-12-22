/**
 * =========================
 * App Execution Mode
 * =========================
 *
 * - web   : 실사용 풀 기능 모드
 * - store : 스토어 심사용 안전 모드
 */
export type AppMode = 'web' | 'store';

/**
 * 실행 모드 결정
 *
 * NEXT_PUBLIC_APP_MODE=store → store
 * 그 외 값 / 미설정 → web
 */
export const APP_MODE: AppMode =
  process.env.NEXT_PUBLIC_APP_MODE === 'store'
    ? 'store'
    : 'web';

/**
 * =========================
 * 🔒 Store Review Policy Switch
 * =========================
 *
 * - UI / 연출 / 사운드 / 리스크 표현 제어
 * - 스토어 심사 리스크 요소를 코드 레벨에서 차단
 * - 모든 화면/로직은 반드시 POLICY를 기준으로 동작해야 함
 */
export const POLICY = {
  /* =========================
   * ENTRY / Trading
   * ========================= */

  /** ENTRY 버튼 노출 */
  enableEntryUI: APP_MODE === 'web',

  /** ENTRY 문구 소프트 처리 (store 전용) */
  entryLabelSafe: APP_MODE === 'store',

  /* =========================
   * EXTREME / Danger Zone
   * ========================= */

  /** EXTREME / Danger Zone 시각 효과 */
  enableExtremeVisuals: APP_MODE === 'web',

  /** EXTREME 전체 화면 연출 (VIP3 전용) */
  enableExtremeFullscreen: APP_MODE === 'web',

  /* =========================
   * Sound / Haptics
   * ========================= */

  /** 사운드 재생 */
  enableSound: APP_MODE === 'web',

  /** 진동 (모바일) */
  enableVibration: APP_MODE === 'web',

  /* =========================
   * VIP / Risk Representation
   * ========================= */

  /** VIP Risk Meter / 확률 그래프 */
  enableRiskMeter: APP_MODE === 'web',

  /** VIP Heatmap 밀도 / 컬러 강화 */
  enableVipHeatmapBoost: APP_MODE === 'web',

  /* =========================
   * Legal / Store Safety
   * ========================= */

  /** 스토어용 고지 문구 강제 */
  disclaimerRequired: APP_MODE === 'store',

  /** 실시간 수익 / 승률 직접 표현 차단 */
  hideDirectProfitLabel: APP_MODE === 'store',
} as const;
