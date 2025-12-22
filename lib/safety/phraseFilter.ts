// lib/safety/phraseFilter.ts

/**
 * App Store 승인 위험 키워드
 */
const BLOCKED_PHRASES = [
  '매수',
  '매도',
  '수익',
  '보장',
  '확정',
  '추천',
  '투자',
  '적중',
  '급등',
  '폭등',
];

/**
 * 안전 문구로 변환
 */
export function sanitizeText(input: string): string {
  let text = input;

  for (const word of BLOCKED_PHRASES) {
    if (text.includes(word)) {
      text = text.replaceAll(word, '시장');
    }
  }

  return text;
}
