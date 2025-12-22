// lib/feature/featureFlags.ts
import { VIPLevel, VIPAddon } from '@/lib/vip/vipTypes';

export type Feature =
  | 'WHALE_HEATMAP'
  | 'EXTREME_MODE'
  | 'BACKTEST'
  | 'REALTIME_ALERT';

/**
 * Feature 사용 조건
 */
type FeatureRule =
  | { level: VIPLevel }
  | { addon: VIPAddon };

/**
 * Feature → 요구 조건 매핑
 */
const featureRules: Record<Feature, FeatureRule> = {
  WHALE_HEATMAP: { level: 'VIP1' },
  BACKTEST: { level: 'VIP2' },
  REALTIME_ALERT: { level: 'VIP2' },

  // 🔥 Add-on 기반 기능
  EXTREME_MODE: { addon: 'EXTREME_BOOST' },
};

/**
 * Feature 사용 가능 여부 판단
 */
export function canUseFeature(
  vipLevel: VIPLevel,
  feature: Feature,
  addons?: Record<string, number>
) {
  const rule = featureRules[feature];

  // VIP 레벨 기준
  if ('level' in rule) {
    const order: VIPLevel[] = ['FREE', 'VIP1', 'VIP2', 'VIP3'];
    return (
      order.indexOf(vipLevel) >=
      order.indexOf(rule.level)
    );
  }

  // Add-on 기준
  if ('addon' in rule) {
    const expireAt = addons?.[rule.addon];
    return typeof expireAt === 'number' && expireAt > Date.now();
  }

  return false;
}
