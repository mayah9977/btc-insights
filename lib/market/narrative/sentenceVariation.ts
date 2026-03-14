/**
 * Sentence Variation Layer
 *
 * 역할
 * - description이 string 또는 string[]일 때
 * - 랜덤 문장을 선택하여 반환
 *
 * 사용 위치
 * Narrative Engine (generateNarrative)
 */

export function pickSentence(
  description: string | string[]
): string {

  /* 단일 문장 */
  if (typeof description === 'string') {
    return description
  }

  /* 배열 보호 */
  if (!Array.isArray(description) || description.length === 0) {
    return ''
  }

  /* 랜덤 선택 */
  const index = Math.floor(Math.random() * description.length)

  return description[index] ?? description[0]
}
