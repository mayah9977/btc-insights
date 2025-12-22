'use client';

import { sanitizeText } from '@/lib/safety/phraseFilter';

export function SafeNotification({
  message,
}: {
  message: string;
}) {
  return <span>{sanitizeText(message)}</span>;
}
