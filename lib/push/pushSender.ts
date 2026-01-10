import { adminMessaging } from "@/lib/firebase-admin";
import {
  getUserPushTokens,
  removeUserPushToken,
} from "./pushTokenStore";

export type SendPushInput = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * ALERT_TRIGGERED → FCM Push
 * - Toast 이후 Secondary UX
 * - 실패해도 시스템 흐름에 영향 없음
 */
export async function sendPush({
  userId,
  title,
  body,
  data,
}: SendPushInput): Promise<{ ok: boolean }> {
  const tokens = await getUserPushTokens(userId);

  if (!tokens.length) {
    console.warn("[PUSH] No tokens", userId);
    return { ok: false };
  }

  // ✅ data-only FCM (foreground / background 공통)
  const message = {
    data: {
      title,
      body,
      ...(data ?? {}),
      clickUrl: "/ko/alerts",
      requireInteraction: "true",
    },
    tokens,
  };

  try {
    const res = await adminMessaging.sendEachForMulticast(message);

    // ❌ 실패 토큰 제거
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        removeUserPushToken(userId, tokens[idx]);
      }
    });

    console.log("[PUSH SENT]", {
      userId,
      success: res.successCount,
      failure: res.failureCount,
    });

    return { ok: res.successCount > 0 };
  } catch (err) {
    console.error("[PUSH ERROR]", err);
    return { ok: false };
  }
}
