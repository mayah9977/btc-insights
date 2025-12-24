// lib/client-fcm.ts
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase-client';

export async function subscribeTopic(topic: string) {
  if (!messaging) {
    throw new Error('Messaging not supported on this browser.');
  }

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
  });

  if (!token) {
    throw new Error('Failed to get FCM token');
  }

  // 서버에 토큰 전달 (예시)
  await fetch('/api/fcm/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, topic }),
  });

  return token;
}


