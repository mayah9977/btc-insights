//lib/push/pushSender.ts

import {
  getUserPushTokens,
  removeClaimedUserPushToken,
  removeUserPushToken,
} from "./pushStore";
import { isPushDeliveryDisabled } from "@/lib/push/pushDeliveryPolicy";

export type SendPushInput = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type SendPushDetailedInput = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

type PushCleanupError = {
  error: unknown;
};

type PushCleanupResult = {
  attemptedCount: number;
  deletedCount: number;
  ownerMismatchOrNotRemovedCount: number;
  failedCount: number;
  errors: PushCleanupError[];
};

type PushDetailedCounts = {
  tokenCount: number;
  successCount: number;
  retryableFailureCount: number;
  finalFailureCount: number;
  errorCodeCounts: Record<string, number>;
  cleanup: PushCleanupResult;
};

export type SendPushResult =
  | {
      ok: false;
      status: "SKIPPED_DELIVERY_DISABLED";
    }
  | {
      ok: boolean;
      status?: never;
    };

export type SendPushDetailedResult =
  | {
      status: "SKIPPED_DELIVERY_DISABLED";
      tokenCount: null;
      successCount: 0;
      retryableFailureCount: 0;
      finalFailureCount: 0;
      errorCodeCounts: Record<string, number>;
      cleanup: PushCleanupResult;
    }
  | {
      status: "FAILED_TOKEN_LOOKUP";
      userId: string;
      tokenCount: null;
      successCount: 0;
      retryableFailureCount: 0;
      finalFailureCount: 0;
      errorCodeCounts: Record<string, number>;
      cleanup: PushCleanupResult;
      error: unknown;
    }
  | {
      status: "SKIPPED_NO_TOKEN";
      userId: string;
      tokenCount: 0;
      successCount: 0;
      retryableFailureCount: 0;
      finalFailureCount: 0;
      errorCodeCounts: Record<string, number>;
      cleanup: PushCleanupResult;
    }
  | ({
      status: "SUCCEEDED_ALL";
      userId: string;
    } & PushDetailedCounts)
  | ({
      status: "SUCCEEDED_PARTIAL";
      userId: string;
    } & PushDetailedCounts)
  | ({
      status: "FAILED_RETRYABLE";
      userId: string;
    } & PushDetailedCounts)
  | ({
      status: "FAILED_FINAL";
      userId: string;
    } & PushDetailedCounts)
  | ({
      status: "FAILED_CALL";
      userId: string;
      error: unknown;
    } & PushDetailedCounts);

function createEmptyCleanupResult(): PushCleanupResult {
  return {
    attemptedCount: 0,
    deletedCount: 0,
    ownerMismatchOrNotRemovedCount: 0,
    failedCount: 0,
    errors: [],
  };
}

const FINAL_PUSH_ERROR_CODES = new Set<string>([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

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
}: SendPushInput): Promise<SendPushResult> {
  if (isPushDeliveryDisabled()) {
    return {
      ok: false,
      status: "SKIPPED_DELIVERY_DISABLED",
    };
  }

  const tokens = await getUserPushTokens(userId);

  // ❗ 토큰 없는 경우
  if (!tokens.length) {
    console.warn("[PUSH] No tokens");
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
    const { adminMessaging } = await import("@/lib/firebase-admin");

    const res = await adminMessaging.sendEachForMulticast(message);

    // ❌ 실패 토큰 제거
    res.responses.forEach((r, idx) => {
      if (!r.success) {
        removeUserPushToken(userId, tokens[idx]);
      }
    });

    // ✅ 성공 로그
    console.log("[PUSH SENT]", {
      success: res.successCount,
      failure: res.failureCount,
    });

    return { ok: res.successCount > 0 };
  } catch (err) {
    console.error("[PUSH ERROR]");
    return { ok: false };
  }
}

export async function sendPushDetailedToUser({
  userId,
  title,
  body,
  data,
}: SendPushDetailedInput): Promise<SendPushDetailedResult> {
  if (isPushDeliveryDisabled()) {
    return {
      status: "SKIPPED_DELIVERY_DISABLED",
      tokenCount: null,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup: createEmptyCleanupResult(),
    };
  }

  let tokens: string[];

  try {
    tokens = await getUserPushTokens(userId);
  } catch (error: unknown) {
    return {
      status: "FAILED_TOKEN_LOOKUP",
      userId,
      tokenCount: null,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup: createEmptyCleanupResult(),
      error,
    };
  }

  if (tokens.length === 0) {
    return {
      status: "SKIPPED_NO_TOKEN",
      userId,
      tokenCount: 0,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup: createEmptyCleanupResult(),
    };
  }

  const tokenCount = tokens.length;

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

  let response;

  try {
    const { adminMessaging } = await import("@/lib/firebase-admin");

    response =
      await adminMessaging.sendEachForMulticast(message);
  } catch (error: unknown) {
    return {
      status: "FAILED_CALL",
      userId,
      tokenCount,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup: createEmptyCleanupResult(),
      error,
    };
  }

  let successCount = 0;
  let retryableFailureCount = 0;
  let finalFailureCount = 0;

  const errorCodeCounts: Record<string, number> = {};
  const finalFailureTokens: string[] = [];

  response.responses.forEach((tokenResponse, index) => {
    if (tokenResponse.success) {
      successCount += 1;
      return;
    }

    const errorCode =
      tokenResponse.error?.code ?? "UNKNOWN";

    errorCodeCounts[errorCode] =
      (errorCodeCounts[errorCode] ?? 0) + 1;

    if (FINAL_PUSH_ERROR_CODES.has(errorCode)) {
      finalFailureCount += 1;

      const token = tokens[index];

      if (token !== undefined) {
        finalFailureTokens.push(token);
      }

      return;
    }

    retryableFailureCount += 1;
  });

  let status:
    | "SUCCEEDED_ALL"
    | "SUCCEEDED_PARTIAL"
    | "FAILED_RETRYABLE"
    | "FAILED_FINAL";

  if (successCount === tokenCount) {
    status = "SUCCEEDED_ALL";
  } else if (successCount > 0) {
    status = "SUCCEEDED_PARTIAL";
  } else if (retryableFailureCount > 0) {
    status = "FAILED_RETRYABLE";
  } else if (finalFailureCount > 0) {
    status = "FAILED_FINAL";
  } else {
    status = "FAILED_RETRYABLE";
  }

  const cleanup =
    createEmptyCleanupResult();

  for (const token of finalFailureTokens) {
    cleanup.attemptedCount += 1;

    try {
      const removed =
        await removeClaimedUserPushToken(
          userId,
          token,
        );

      if (removed) {
        cleanup.deletedCount += 1;
      } else {
        cleanup.ownerMismatchOrNotRemovedCount += 1;
      }
    } catch (error: unknown) {
      cleanup.failedCount += 1;
      cleanup.errors.push({
        error,
      });
    }
  }

  return {
    status,
    userId,
    tokenCount,
    successCount,
    retryableFailureCount,
    finalFailureCount,
    errorCodeCounts,
    cleanup,
  };
}
