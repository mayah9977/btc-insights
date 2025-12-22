export type NotificationLevel =
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL';

export type NotificationItem = {
  message: string;
  level: NotificationLevel;
  at: number;
  reliability?: number; // 예측 신뢰도 (0~1)
};
