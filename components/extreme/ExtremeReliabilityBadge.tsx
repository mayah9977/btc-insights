'use client';

/**
 * Extreme 평균 신뢰도 상태 배지
 * - Stable / Warning / Critical
 * - 색상으로 즉시 상태 인지
 */
export function ExtremeReliabilityBadge({
  avg,
}: {
  avg: number;
}) {
  let label = 'Stable';
  let classes =
    'bg-green-100 text-green-700 border-green-300';

  if (avg >= 0.5) {
    label = 'Warning';
    classes =
      'bg-yellow-100 text-yellow-700 border-yellow-300';
  }

  if (avg >= 0.7) {
    label = 'Critical';
    classes =
      'bg-red-100 text-red-700 border-red-300';
  }

  return (
    <span
      className={`inline-flex items-center
        px-3 py-1 text-xs font-semibold
        rounded-full border ${classes}`}
    >
      {label}
    </span>
  );
}
