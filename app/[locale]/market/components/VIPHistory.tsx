"use client";

const mockHistory = [
  {
    time: "12:01",
    action: "FORCE ENTRY",
    symbol: "BTC",
  },
  {
    time: "12:05",
    action: "DISABLE SIGNAL",
    symbol: "ETH",
  },
];

export default function VIPHistory() {
  return (
    <div className="mt-6 rounded-xl bg-zinc-900 p-4 text-white">
      <h3 className="font-bold text-purple-400 mb-3">
        🎩 VIP Operation History
      </h3>

      <ul className="space-y-2 text-sm">
        {mockHistory.map((h, i) => (
          <li key={i} className="flex justify-between">
            <span>{h.time}</span>
            <span>{h.action}</span>
            <span>{h.symbol}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
