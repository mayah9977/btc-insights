//lib/push/pushSender.ts

import {
  getUserPushTokens,
  removeClaimedUserPushToken,
} from "./pushStore";
import {
  getNativeInstallationFcmToken,
  getNativeOwnerInstallationCandidates,
  removeInvalidNativeFcmToken,
  resolveNativeOwnerLookupForUserId,
} from "@/lib/native/nativeInstallationStore";
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

const MAX_MULTICAST_TOKENS = 500;

const NATIVE_LOOKUP_ERROR_MESSAGE =
  "NATIVE_RECIPIENT_LOOKUP_FAILED";
const NATIVE_CLEANUP_ERROR_MESSAGE =
  "NATIVE_PUSH_TOKEN_CLEANUP_FAILED";

type WebPushRecipient = {
  transport: "WEB";
  token: string;
};

type NativePushRecipient = {
  transport: "NATIVE";
  installationId: string;
  token: string;
};

type PushRecipient =
  | WebPushRecipient
  | NativePushRecipient;

type NativeRecipientLookupResult =
  | {
      status: "OK";
      recipients: NativePushRecipient[];
    }
  | {
      status: "FAILED";
      recipients: [];
      error: Error;
    };

function createNativeLookupError(): Error {
  return new Error(NATIVE_LOOKUP_ERROR_MESSAGE);
}

async function lookupNativeRecipients(
  userId: string,
): Promise<NativeRecipientLookupResult> {
  try {
    const ownerResolution =
      await resolveNativeOwnerLookupForUserId(userId);

    if (ownerResolution.status !== "RESOLVED") {
      return {
        status: "FAILED",
        recipients: [],
        error: createNativeLookupError(),
      };
    }

    const ownerLookup =
      await getNativeOwnerInstallationCandidates(
        ownerResolution.owner,
      );

    if (ownerLookup.status !== "OK") {
      return {
        status: "FAILED",
        recipients: [],
        error: createNativeLookupError(),
      };
    }

    const recipients: NativePushRecipient[] = [];

    for (const installation of ownerLookup.installations) {
      const token =
        await getNativeInstallationFcmToken(
          installation.installationId,
        );

      if (!token) {
        continue;
      }

      recipients.push({
        transport: "NATIVE",
        installationId:
          installation.installationId,
        token,
      });
    }

    return {
      status: "OK",
      recipients,
    };
  } catch {
    return {
      status: "FAILED",
      recipients: [],
      error: createNativeLookupError(),
    };
  }
}

function combineRecipients(
  webTokens: string[],
  nativeRecipients: NativePushRecipient[],
): PushRecipient[] {
  const byToken = new Map<string, PushRecipient>();

  // Existing Web ownership wins exact-token collisions so
  // permanent-invalid cleanup keeps the previous Web contract.
  for (const token of webTokens) {
    if (!byToken.has(token)) {
      byToken.set(token, {
        transport: "WEB",
        token,
      });
    }
  }

  for (const recipient of nativeRecipients) {
    if (!byToken.has(recipient.token)) {
      byToken.set(recipient.token, recipient);
    }
  }

  return [...byToken.values()];
}

function createMulticastMessage(
  recipients: PushRecipient[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  return {
    data: {
      title,
      body,
      clickUrl: "/ko/alerts",
      requireInteraction: "true",
      ...(data ?? {}),
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
    },
    tokens: recipients.map(
      recipient => recipient.token,
    ),
  };
}

async function cleanupPermanentInvalidRecipient(
  userId: string,
  recipient: PushRecipient,
  cleanup: PushCleanupResult,
): Promise<void> {
  cleanup.attemptedCount += 1;

  try {
    if (recipient.transport === "WEB") {
      const removed =
        await removeClaimedUserPushToken(
          userId,
          recipient.token,
        );

      if (removed) {
        cleanup.deletedCount += 1;
      } else {
        cleanup.ownerMismatchOrNotRemovedCount += 1;
      }

      return;
    }

    const result =
      await removeInvalidNativeFcmToken(
        recipient.installationId,
        recipient.token,
      );

    if (result === "REMOVED") {
      cleanup.deletedCount += 1;
    } else {
      cleanup.ownerMismatchOrNotRemovedCount += 1;
    }
  } catch (error: unknown) {
    cleanup.failedCount += 1;

    cleanup.errors.push({
      error:
        recipient.transport === "NATIVE"
          ? new Error(NATIVE_CLEANUP_ERROR_MESSAGE)
          : error,
    });
  }
}

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
  const result = await sendPushDetailedToUser({
    userId,
    title,
    body,
    data,
  });

  if (
    result.status ===
    "SKIPPED_DELIVERY_DISABLED"
  ) {
    return {
      ok: false,
      status: "SKIPPED_DELIVERY_DISABLED",
    };
  }

  if (result.status === "SKIPPED_NO_TOKEN") {
    console.warn("[PUSH] No tokens");
  }

  return {
    ok: result.successCount > 0,
  };
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

  let webTokens: string[];

  try {
    webTokens = await getUserPushTokens(userId);
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

  const nativeLookup =
    await lookupNativeRecipients(userId);
  const nativeLookupFailed =
    nativeLookup.status === "FAILED";

  if (
    nativeLookupFailed &&
    webTokens.length === 0
  ) {
    return {
      status: "FAILED_TOKEN_LOOKUP",
      userId,
      tokenCount: null,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup: createEmptyCleanupResult(),
      error: nativeLookup.error,
    };
  }

  const recipients = combineRecipients(
    webTokens,
    nativeLookup.status === "OK"
      ? nativeLookup.recipients
      : [],
  );

  if (recipients.length === 0) {
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

  const tokenCount = recipients.length;
  const cleanup = createEmptyCleanupResult();

  let successCount = 0;
  let retryableFailureCount = 0;
  let finalFailureCount = 0;
  let responseCount = 0;
  let callFailureRecipientCount = 0;
  let firstCallError: unknown = null;

  const errorCodeCounts: Record<string, number> = {};
  const finalFailureRecipients: PushRecipient[] = [];

  let adminMessaging;

  try {
    const firebaseAdmin =
      await import("@/lib/firebase-admin");

    adminMessaging = firebaseAdmin.adminMessaging;
  } catch (error: unknown) {
    return {
      status: "FAILED_CALL",
      userId,
      tokenCount,
      successCount: 0,
      retryableFailureCount: 0,
      finalFailureCount: 0,
      errorCodeCounts: {},
      cleanup,
      error,
    };
  }

  for (
    let start = 0;
    start < recipients.length;
    start += MAX_MULTICAST_TOKENS
  ) {
    const chunk = recipients.slice(
      start,
      start + MAX_MULTICAST_TOKENS,
    );

    try {
      const response =
        await adminMessaging.sendEachForMulticast(
          createMulticastMessage(
            chunk,
            title,
            body,
            data,
          ),
        );

      response.responses.forEach(
        (tokenResponse, index) => {
          const recipient = chunk[index];

          if (!recipient) {
            return;
          }

          responseCount += 1;

          if (tokenResponse.success) {
            successCount += 1;
            return;
          }

          const errorCode =
            tokenResponse.error?.code ?? "UNKNOWN";

          errorCodeCounts[errorCode] =
            (errorCodeCounts[errorCode] ?? 0) + 1;

          if (
            FINAL_PUSH_ERROR_CODES.has(errorCode)
          ) {
            finalFailureCount += 1;
            finalFailureRecipients.push(recipient);
            return;
          }

          retryableFailureCount += 1;
        },
      );
    } catch (error: unknown) {
      callFailureRecipientCount += chunk.length;
      retryableFailureCount += chunk.length;

      if (firstCallError === null) {
        firstCallError = error;
      }
    }
  }

  for (const recipient of finalFailureRecipients) {
    await cleanupPermanentInvalidRecipient(
      userId,
      recipient,
      cleanup,
    );
  }

  if (
    responseCount === 0 &&
    callFailureRecipientCount === tokenCount
  ) {
    return {
      status: "FAILED_CALL",
      userId,
      tokenCount,
      successCount,
      retryableFailureCount,
      finalFailureCount,
      errorCodeCounts,
      cleanup,
      error:
        firstCallError ??
        new Error("PUSH_DELIVERY_CALL_FAILED"),
    };
  }

  let status:
    | "SUCCEEDED_ALL"
    | "SUCCEEDED_PARTIAL"
    | "FAILED_RETRYABLE"
    | "FAILED_FINAL";

  if (nativeLookupFailed) {
    if (
      retryableFailureCount > 0 ||
      callFailureRecipientCount > 0
    ) {
      status = "FAILED_RETRYABLE";
    } else if (successCount > 0) {
      status = "SUCCEEDED_PARTIAL";
    } else {
      status = "FAILED_RETRYABLE";
    }
  } else if (callFailureRecipientCount > 0) {
    status =
      successCount > 0
        ? "SUCCEEDED_PARTIAL"
        : "FAILED_RETRYABLE";
  } else if (successCount === tokenCount) {
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
