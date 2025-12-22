"use client";


type TrendType = "Bullish" | "Bearish" | "Neutral";

interface TrendBadgeProps {
  trend: TrendType;
}

export default function TrendBadge({ trend }: TrendBadgeProps) {
  const styleMap: Record<TrendType, string> = {
    Bullish: "bg-red-500 text-white",
    Bearish: "bg-blue-500 text-white",
    Neutral: "bg-gray-500 text-white",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${styleMap[trend]}`}
    >
      {trend}
    </span>
  );
}
