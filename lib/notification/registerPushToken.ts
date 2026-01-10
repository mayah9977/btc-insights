import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase-config";

/**
 * Client-side FCM Token registration
 * 1. Permission
 * 2. Service Worker
 * 3. Get FCM Token
 * 4. Send token to server (registerPushToken)
 */
export async function registerPushToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!messaging) return null;
  if (!("serviceWorker" in navigator)) return null;

  // 1️⃣ Notification permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("[FCM] Notification permission denied");
    return null;
  }

  // 2️⃣ Service Worker (reuse if exists)
  const registration =
    (await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js"
    )) ||
    (await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    ));

  // 3️⃣ Get FCM token
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    console.warn("[FCM] Token not issued");
    return null;
  }

  console.log("[FCM] TOKEN:", token);

  // ⚠️ 개발 / 테스트 단계용 userId
  // (나중에 로그인 연동 시 실제 userId로 교체)
  const userId = "dev-user";

  // 4️⃣ 🔥 Send token to server
  try {
    const res = await fetch("/api/notification/register-push-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        token,
      }),
    });

    if (!res.ok) {
      console.error("[FCM] Failed to register token on server");
    } else {
      console.log("[FCM] Token registered on server");
    }
  } catch (err) {
    console.error("[FCM] registerPushToken error", err);
  }

  return token;
}
