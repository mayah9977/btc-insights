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

  const emotionalFlow = seed % 100
  const riskTolerance = (seed >> 2) % 100
  const focusLevel = (seed >> 3) % 100

  return {
    age,
    zodiac,
    chineseZodiac,
    emotionalFlow,
    riskTolerance,
    focusLevel,
    message: generateMessage(
      emotionalFlow,
      riskTolerance,
      focusLevel,
    ),
  }
}

function generateMessage(
  emotion: number,
  risk: number,
  focus: number,
) {
  if (emotion > 70 && risk > 60) {
    return '오늘은 내적 에너지가 고조된 모습을 보입니다. 강한 확신이 생길 수 있으나, 논리와 절제를 균형 있게 유지하십시오.'
  }

  if (emotion < 30) {
    return '오늘은 감정적 민감도가 높습니다. 감정적으로 반응하기보다 매사에 여유를 가지세요.'
  }

  if (focus > 75) {
    return '멘탈이 받쳐주는 날입니다. 전략적 포지션에 공격적으로 대처하세요.'
  }

  return '균형 잡힌 하루가 될수 있도록 여유를 가지고 세심한곳까지 살피세요.'
}
