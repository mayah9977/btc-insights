'use client';

export function ExtremeTrendSpark({
  values,
}: {
  values: number[];
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          style={{ height: `${(v / max) * 100}%` }}
          className="w-1 bg-blue-400 rounded"
        />
      ))}
    </div>
  );
}
