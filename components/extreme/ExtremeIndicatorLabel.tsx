'use client';

import { ExtremeToolTip } from './ExtremeToolTip';
import type { ExtremeIndicatorKey } from '@/lib/extreme/extremeIndicatorMeta';

export function ExtremeIndicatorLabel({
  type,
}: {
  type: ExtremeIndicatorKey;
}) {
  return (
    <div style={{ display: 'inline-block' }}>
      <span>{type}</span>
      <ExtremeToolTip type={type} />
    </div>
  );
}
