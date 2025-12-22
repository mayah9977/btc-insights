export function playVIPRiskSound(probability: number) {
  let src = '/sounds/risk-low.mp3';

  if (probability >= 0.8) src = '/sounds/risk-extreme.mp3';
  else if (probability >= 0.6) src = '/sounds/risk-high.mp3';
  else if (probability >= 0.4) src = '/sounds/risk-mid.mp3';

  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.play().catch(() => {});
}
