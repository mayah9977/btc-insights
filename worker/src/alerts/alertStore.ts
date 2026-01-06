export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertRepeat = 'ONCE' | 'REPEAT';

export type PriceAlert = {
  id: string;
  userId: string;
  exchange: 'BINANCE';
  symbol: string;
  targetPrice: number;
  condition: AlertCondition;
  repeat: AlertRepeat;
  triggered: boolean;
  lastTriggeredAt?: number;
  createdAt: number;
};

const alerts: PriceAlert[] = []; // ⚠️ 실전: API / Redis / DB

export async function getActiveAlerts(symbol: string) {
  return alerts.filter(
    a =>
      a.symbol === symbol &&
      (!a.triggered || a.repeat === 'REPEAT')
  );
}

export async function markAlertTriggered(id: string) {
  const a = alerts.find(x => x.id === id);
  if (a) a.triggered = true;
}

export async function updateAlert(
  id: string,
  patch: Partial<PriceAlert>
) {
  const idx = alerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    alerts[idx] = { ...alerts[idx], ...patch };
  }
}
