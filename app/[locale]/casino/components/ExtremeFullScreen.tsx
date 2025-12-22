'use client';

import { useVIPLevel } from '../lib/vipLevelStore';
import { useExtremeTheme } from '../lib/extremeThemeStore';
import { POLICY } from 'lib/policy/switch';

export default function ExtremeFullScreen() {
  const { vipLevel } = useVIPLevel();
  const { extreme } = useExtremeTheme();

  if (
    !POLICY.enableExtremeVisuals ||
    vipLevel !== 'VIP3' ||
    !extreme
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 flex items-center justify-center pointer-events-none">
      <div className="text-center animate-pulse">
        <div className="text-6xl font-extrabold text-red-400">
          EXTREME
        </div>
        <p className="mt-4 text-red-300 font-bold">
          VIP3 FULL POWER MODE
        </p>
      </div>
    </div>
  );
}
