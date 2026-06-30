'use client';

import { useVIPNotification } from '../lib/vipNotificationStore';

export default function VIPNotificationPanel() {
  const { queue, pop } = useVIPNotification();

  const focusSymbol = (symbol?: string) => {
    if (!symbol) return;

    const coin = document.getElementById(`coin-${symbol}`);
    const heat = document.getElementById(`heat-${symbol}`);

    coin?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    heat?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    coin?.classList.add('ring-4', 'ring-red-500');
    setTimeout(() => {
      coin?.classList.remove('ring-4', 'ring-red-500');
    }, 1500);
  };

  return (
    <aside className="fixed right-4 bottom-4 w-80 bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-2 z-50">
      <h3 className="font-bold text-white">
        🔔 VIP Notification Timeline
      </h3>

      {queue.length === 0 && (
        <p className="text-xs text-neutral-400">알림 없음</p>
      )}

      <ul className="space-y-2 max-h-64 overflow-auto">
        {queue.map((n) => (
          <li
            key={n.id}
            onClick={() => focusSymbol(n.symbol)}
            className={`p-2 rounded text-sm cursor-pointer ${
              n.priority === 'HIGH'
                ? 'bg-red-500/20 text-red-400'
                : n.priority === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}
          >
            <div className="font-bold">{n.priority}</div>
            <div>{n.message}</div>
          </li>
        ))}
      </ul>

      {queue.length > 0 && (
        <button
          onClick={pop}
          className="w-full text-xs text-neutral-400 hover:text-white"
        >
          oldest 제거
        </button>
      )}
    </aside>
  );
}
