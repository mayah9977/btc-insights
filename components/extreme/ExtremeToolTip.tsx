'use client';

import { EXTREME_META } from '@/lib/extreme/extremeIndicatorMeta';
import type { ExtremeIndicatorKey } from '@/lib/extreme/extremeIndicatorMeta';

export function ExtremeToolTip({
  type,
}: {
  type: ExtremeIndicatorKey;
}) {
  const meta = EXTREME_META[type];

  if (!meta) return null;

  return (
    <div style={{ marginTop: 6, padding: 8, fontSize: 13, border: '1px solid #ddd', borderRadius: 6 }}>
      <strong>{meta.title}</strong>
      <div style={{ marginTop: 4 }}>{meta.description}</div>
      <div style={{ marginTop: 6, opacity: 0.65 }}>
        참고용 데이터이며 특정 결과를 보장하지 않습니다.
      </div>
    </div>
  );
}
