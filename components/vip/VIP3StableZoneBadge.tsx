'use client';

export function VIP3StableZoneBadge({
  active,
}: {
  active: boolean;
}) {
  if (!active) return null;

  return (
    <div className="px-3 py-1 text-xs rounded-full
      bg-green-100 text-green-700 border border-green-300">
      안정 구간 (Stable Zone)
    </div>
  );
}
