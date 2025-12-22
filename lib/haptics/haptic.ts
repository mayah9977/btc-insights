export type HapticLevel = 'OFF' | 'SOFT' | 'STRONG';

export function playHaptic(level: HapticLevel) {
  if (!navigator.vibrate) return;

  if (level === 'SOFT') {
    navigator.vibrate(30);
  }

  if (level === 'STRONG') {
    navigator.vibrate([60, 40, 60]);
  }
}
