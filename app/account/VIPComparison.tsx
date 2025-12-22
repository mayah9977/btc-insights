"use client";

export default function VIPComparison({
  myPNL,
  vipAvgPNL,
}: {
  myPNL: number;
  vipAvgPNL: number;
}) {
  const diff = myPNL - vipAvgPNL;

  return (
    <div className="rounded-xl bg-gradient-to-br from-yellow-900 to-black p-4 text-white">
      <h3 className="font-bold mb-2">👑 VIP League</h3>

      <div className="text-sm opacity-80">
        VIP Average: {vipAvgPNL.toFixed(2)} USDT
      </div>

      <div
        className={`mt-2 text-2xl font-bold ${
          diff >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {diff >= 0 ? "+" : ""}
        {diff.toFixed(2)} USDT
      </div>

      <div className="mt-1 text-xs opacity-70">
        {diff >= 0
          ? "You are outperforming VIPs"
          : "Below VIP average"}
      </div>
    </div>
  );
}
