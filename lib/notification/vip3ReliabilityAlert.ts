import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore';
import type { NotificationItem } from './notificationTypes';

export function shouldTriggerVIP3Alert(
  threshold = 0.85
) {
  return getAverageReliability() >= threshold;
}

export function buildVIP3ReliabilityNotification(): NotificationItem {
  return {
    message: 'VIP3: Extreme 신호 신뢰도 평균이 매우 높습니다',
    level: 'CRITICAL',
    at: Date.now(),
    reliability: getAverageReliability(),
  };
}
