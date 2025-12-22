// components/FeatureFlag.tsx
'use client';

import { Feature, canUseFeature } from '@/lib/feature/featureFlags';
import { useVIP } from '@/lib/vip/vipClient';

export function FeatureFlag({
  feature,
  children,
  fallback = null,
}: {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { vipLevel, addons } = useVIP();

  if (!canUseFeature(vipLevel, feature, addons)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
