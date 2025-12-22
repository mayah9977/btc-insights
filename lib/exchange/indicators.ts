export function calculateRSI(closes: number[], period = 14) {
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period - 1; i < closes.length - 1; i++) {
    const diff = closes[i + 1] - closes[i];
    diff >= 0 ? (gains += diff) : (losses -= diff);
  }

  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}
