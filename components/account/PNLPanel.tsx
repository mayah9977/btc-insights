"use client";

import { useEffect, useState } from "react";

export default function PNLPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/account/pnl")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="bg-black text-white p-4 rounded-xl">
      <h2 className="font-bold text-lg">내 계정 PNL</h2>

      <p className="mt-2 text-green-400">
        Total: ${data.totalPNL.toFixed(2)}
      </p>

      <ul className="mt-4 space-y-2">
        {data.positions.map((p: any) => (
          <li key={p.symbol} className="flex justify-between">
            <span>{p.symbol} ({p.side})</span>
            <span
              className={
                p.pnl >= 0 ? "text-green-400" : "text-red-400"
              }
            >
              {p.pnl.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
