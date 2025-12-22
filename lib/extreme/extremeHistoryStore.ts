type HistoryItem = {
  at: number;
  reliability: number;
};

const MAX = 50;
const history: HistoryItem[] = [];

export function pushExtremeHistory(reliability: number) {
  history.push({
    at: Date.now(),
    reliability,
  });

  if (history.length > MAX) {
    history.shift();
  }
}

export function getExtremeHistory() {
  return history;
}

export function getAverageReliability() {
  if (history.length === 0) return 0;

  const sum = history.reduce(
    (acc, h) => acc + h.reliability,
    0
  );

  return sum / history.length;
}
