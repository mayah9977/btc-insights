export function getTimeZoneMultiplier(date = new Date()): number {
  const hour = date.getHours();

  // 🌙 22:00 ~ 04:59 (야간)
  if (hour >= 22 || hour < 5) {
    return 1.25; // 확률 25% 증가
  }

  // 🌅 05:00 ~ 08:59 (이른 아침)
  if (hour >= 5 && hour < 9) {
    return 1.15;
  }

  // ☀️ 주간
  return 1.0;
}
