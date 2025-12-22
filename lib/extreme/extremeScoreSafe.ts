import { normalizeExtremeScore } from './extremeScoreNormalizer';

export function safeExtremeScore(input: any) {
  try {
    const num = Number(input);
    return normalizeExtremeScore(num);
  } catch {
    return 0;
  }
}
