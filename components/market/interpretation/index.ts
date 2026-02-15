// components/market/interpretation/index.ts

/**
 * Prohibition Barrel
 *
 * ❌ DO NOT export any interpretation components directly
 * ❌ numeric / limited / full 접근 금지
 *
 * ✅ Only ActionGateRenderer is allowed as an entry point
 *
 * This enforces Action Gate as the single authority
 * for rendering any Risk / Judgment UI.
 */

export { ActionGateRenderer } from './ActionGateRenderer'
export type { ActionGateState } from '@/components/system/ActionGateStatus'
