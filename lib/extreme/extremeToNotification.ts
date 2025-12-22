import type {
  NotificationLevel,
  NotificationItem,
} from '@/lib/notification/notificationTypes';
import { calcExtremeReliability } from './extremeReliability';

export type ExtremeEvent = {
  type: string;
  score: number;
};

export function extremeToNotification(
  e: ExtremeEvent
): NotificationItem | null {
  if (e.score < 70) return null;

  const level: NotificationLevel =
    e.score >= 90 ? 'CRITICAL' : 'WARNING';

  return {
    message: `[${e.type}] 신호 감지`,
    level,
    at: Date.now(),
    reliability: calcExtremeReliability(e.score),
  } as NotificationItem & { reliability: number };
}
