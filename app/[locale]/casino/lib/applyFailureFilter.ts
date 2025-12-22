type FilterInput = {
  aiScore: number;
  funding: number;
  rsi: number;
};

export function applyFailureFilter({
  aiScore,
  funding,
  rsi,
}: FilterInput) {
  let penalty = 0;

  if (funding > 0.02 && rsi > 65) penalty += 15;
  if (funding > 0.015 && rsi > 70) penalty += 20;

  return Math.max(40, aiScore - penalty);
}
