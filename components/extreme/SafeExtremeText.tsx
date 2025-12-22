import { sanitizeText } from '@/lib/safety/phraseFilter';

export function SafeExtremeText({ text }: { text: string }) {
  return <>{sanitizeText(text)}</>;
}
