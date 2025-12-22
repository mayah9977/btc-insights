type Stat = {
  received: number;
  dropped: number;
};

const stat: Stat = {
  received: 0,
  dropped: 0,
};

let lastAt = Date.now();

export function markMessageReceived() {
  stat.received++;
  lastAt = Date.now();
}

export function checkDrop(timeoutMs = 5000) {
  if (Date.now() - lastAt > timeoutMs) {
    stat.dropped++;
    lastAt = Date.now();
  }
}

export function getStreamQuality() {
  const total = stat.received + stat.dropped;
  const dropRate =
    total === 0 ? 0 : stat.dropped / total;

  return {
    ...stat,
    dropRate,
  };
}
