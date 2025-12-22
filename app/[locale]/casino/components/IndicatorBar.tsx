"use client";


interface IndicatorBarProps {
  label: string;
  value: number;
}

export default function IndicatorBar({ label, value }: IndicatorBarProps) {
  return (
    <div className="flex justify-between text-sm text-zinc-400">
      <span>{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
