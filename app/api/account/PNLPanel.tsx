"use client";

import { useEffect, useState } from "react";

export default function PNLPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/account/pnl")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading PNL...</div>;

  return (
    <div className="rounded-xl bg-zinc-900 p-4 text-white shadow-lg">
      <h3 className="text-lg font-bold mb-2">📊 My Binance PNL</h3>

      <div className="text-sm opacity-80">
        Balance: {Number(data.balance).toFixed(2)} USDT
      </div>

      <div
        className={`mt-2 text-2xl font-bold ${
          data.totalPNL >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {data.totalPNL >= 0 ? "+" : ""}
        {Number(data.totalPNL).toFixed(2)} USDT
      </div>

      <div className="mt-3 text-xs opacity-60">
        Positions: {data.positions.length}
      </div>
    </div>
  );
}
