import { getZodiacSign } from './zodiac'
import { getChineseZodiac } from './chineseZodiac'

function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getAge(birthDate: Date) {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function generateTodayFortune(birth: string) {
  const birthDate = new Date(birth)
  const age = getAge(birthDate)

  const zodiac = getZodiacSign(
    birthDate.getMonth() + 1,
    birthDate.getDate(),
  )

  const chineseZodiac = getChineseZodiac(
    birthDate.getFullYear(),
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const seed = hashString(birth + todayStr)

  // ====== 새로운 운세 지표 ======
  const loveLuck = seed % 100
  const moneyLuck = (seed >> 2) % 100
  const healthLuck = (seed >> 3) % 100
  const careerLuck = (seed >> 4) % 100

  return {
    age,
    zodiac,
    chineseZodiac,
    loveLuck,
    moneyLuck,
    healthLuck,
    careerLuck,
    detailedMessage: {
      love: generateLoveMessage(loveLuck),
      money: generateMoneyMessage(moneyLuck),
      health: generateHealthMessage(healthLuck),
      career: generateCareerMessage(careerLuck),
    },
  }
}

/* ===========================
   메시지 생성 로직 (한국어)
=========================== */

function generateLoveMessage(score: number) {
  if (score > 75)
    return '오늘은 애정운이 매우 강합니다. 솔직한 감정 표현이 관계를 깊게 만듭니다.'
  if (score > 50)
    return '안정적인 흐름입니다. 작은 배려가 큰 신뢰로 이어질 수 있습니다.'
  if (score > 30)
    return '감정 기복이 있을 수 있습니다. 오해를 만들지 않도록 대화를 충분히 하세요.'
  return '예민해질 수 있는 날입니다. 감정보다 이성을 우선하세요.'
}

function generateMoneyMessage(score: number) {
  if (score > 75)
    return '금전운이 상승 흐름입니다. 기회가 보이면 과감한 판단도 유효합니다.'
  if (score > 50)
    return '안정적인 재정 흐름입니다. 무리한 확장은 피하세요.'
  if (score > 30)
    return '지출 관리가 중요합니다. 충동 소비를 조심하세요.'
  return '재정적으로 보수적인 접근이 필요합니다. 리스크 관리를 강화하세요.'
}

function generateHealthMessage(score: number) {
  if (score > 75)
    return '활력이 높은 날입니다. 새로운 루틴을 시작하기 좋습니다.'
  if (score > 50)
    return '컨디션이 무난합니다. 수면과 수분 섭취를 유지하세요.'
  if (score > 30)
    return '피로가 누적될 수 있습니다. 무리한 일정은 조절하세요.'
  return '휴식이 반드시 필요한 날입니다. 몸의 신호를 무시하지 마세요.'
}

function generateCareerMessage(score: number) {
  if (score > 75)
    return '커리어 운이 강하게 작용합니다. 중요한 결정에 유리한 날입니다.'
  if (score > 50)
    return '안정적인 업무 흐름입니다. 세밀한 검토가 성과를 높입니다.'
  if (score > 30)
    return '집중력이 분산될 수 있습니다. 우선순위를 명확히 하세요.'
  return '충돌 가능성이 있습니다. 신중하고 차분하게 대응하세요.'
}
