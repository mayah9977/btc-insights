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
      candidateCount: number;
      tokenCount: number;
    }
  | {
      status: "FAILED";
      recipients: [];
      candidateCount: number;
      tokenCount: number;
      error: Error;
    };

type PushDeliveryAggregate = {
  webTokenCount: number;
  nativeCandidateCount: number;
  nativeTokenCount: number;
  webSelectedCount: number;
  nativeSelectedCount: number;
  dedupedTotalCount: number;
  webSuccessCount: number;
  webFinalFailureCount: number;
  webRetryableFailureCount: number;
  webCallFailureCount: number;
  nativeSuccessCount: number;
  nativeFinalFailureCount: number;
  nativeRetryableFailureCount: number;
  nativeCallFailureCount: number;
  nativeLookupFailed: boolean;
};

function createPushDeliveryAggregate(): PushDeliveryAggregate {
  return {
    webTokenCount: 0,
    nativeCandidateCount: 0,
    nativeTokenCount: 0,
    webSelectedCount: 0,
    nativeSelectedCount: 0,
    dedupedTotalCount: 0,
    webSuccessCount: 0,
    webFinalFailureCount: 0,
    webRetryableFailureCount: 0,
    webCallFailureCount: 0,
    nativeSuccessCount: 0,
    nativeFinalFailureCount: 0,
    nativeRetryableFailureCount: 0,
    nativeCallFailureCount: 0,
    nativeLookupFailed: false,
  };
}

function createAggregateEmitter(
  aggregate: PushDeliveryAggregate,
) {
  let emitted = false;

  return (
    finalDeliveryStatus:
      SendPushDetailedResult["status"],
  ): void => {
    if (emitted) {
      return;
    }

    emitted = true;

    try {
      console.info("[PUSH_DELIVERY_AGGREGATE]", {
        WEB_TOKEN_COUNT:
          aggregate.webTokenCount,
        NATIVE_CANDIDATE_COUNT:
          aggregate.nativeCandidateCount,
        NATIVE_TOKEN_COUNT:
          aggregate.nativeTokenCount,
        WEB_SELECTED_COUNT:
          aggregate.webSelectedCount,
        NATIVE_SELECTED_COUNT:
          aggregate.nativeSelectedCount,
        DEDUPED_TOTAL_COUNT:
          aggregate.dedupedTotalCount,
        WEB_SUCCESS_COUNT:
          aggregate.webSuccessCount,
        WEB_FINAL_FAILURE_COUNT:
          aggregate.webFinalFailureCount,
        WEB_RETRYABLE_FAILURE_COUNT:
          aggregate.webRetryableFailureCount,
        WEB_CALL_FAILURE_COUNT:
          aggregate.webCallFailureCount,
        NATIVE_SUCCESS_COUNT:
          aggregate.nativeSuccessCount,
        NATIVE_FINAL_FAILURE_COUNT:
          aggregate.nativeFinalFailureCount,
        NATIVE_RETRYABLE_FAILURE_COUNT:
          aggregate.nativeRetryableFailureCount,
        NATIVE_CALL_FAILURE_COUNT:
          aggregate.nativeCallFailureCount,
        NATIVE_LOOKUP_FAILED:
          aggregate.nativeLookupFailed,
        FINAL_DELIVERY_STATUS:
          finalDeliveryStatus,
      });
    } catch {
      // Diagnostics must not affect delivery.
    }
  };
}

function createNativeLookupError(): Error {
  return new Error(NATIVE_LOOKUP_ERROR_MESSAGE);
}

async function lookupNativeRecipients(
  userId: string,
): Promise<NativeRecipientLookupResult> {
  let candidateCount = 0;
  let tokenCount = 0;

  try {
    const ownerResolution =
      await resolveNativeOwnerLookupForUserId(userId);

    if (ownerResolution.status !== "RESOLVED") {
      return {
        status: "FAILED",
        recipients: [],
        candidateCount,
        tokenCount,
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
        candidateCount,
        tokenCount,
        error: createNativeLookupError(),
      };
    }

    candidateCount =
      ownerLookup.installations.length;

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
      tokenCount += 1;
    }

    return {
      status: "OK",
      recipients,
      candidateCount,
      tokenCount,
    };
  } catch {
    return {
      status: "FAILED",
      recipients: [],
      candidateCount,
      tokenCount,
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
    android: {
      priority: "high" as const,
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
  const aggregate = createPushDeliveryAggregate();
  const emitAggregateOnce =
    createAggregateEmitter(aggregate);

  if (isPushDeliveryDisabled()) {
    emitAggregateOnce("SKIPPED_DELIVERY_DISABLED");

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
    aggregate.webTokenCount = webTokens.length;
  } catch (error: unknown) {
    emitAggregateOnce("FAILED_TOKEN_LOOKUP");

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

  aggregate.nativeCandidateCount =
    nativeLookup.candidateCount;
  aggregate.nativeTokenCount =
    nativeLookup.tokenCount;
  aggregate.nativeLookupFailed =
    nativeLookupFailed;

  if (
    nativeLookupFailed &&
    webTokens.length === 0
  ) {
    emitAggregateOnce("FAILED_TOKEN_LOOKUP");

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

  aggregate.webSelectedCount =
    recipients.filter(
      recipient => recipient.transport === "WEB",
    ).length;
  aggregate.nativeSelectedCount =
    recipients.filter(
      recipient => recipient.transport === "NATIVE",
    ).length;
  aggregate.dedupedTotalCount =
    recipients.length;

  if (recipients.length === 0) {
    emitAggregateOnce("SKIPPED_NO_TOKEN");

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
    aggregate.webCallFailureCount +=
      aggregate.webSelectedCount;
    aggregate.nativeCallFailureCount +=
      aggregate.nativeSelectedCount;

    emitAggregateOnce("FAILED_CALL");

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

            if (recipient.transport === "WEB") {
              aggregate.webSuccessCount += 1;
            } else {
              aggregate.nativeSuccessCount += 1;
            }

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

            if (recipient.transport === "WEB") {
              aggregate.webFinalFailureCount += 1;
            } else {
              aggregate.nativeFinalFailureCount += 1;
            }

            return;
          }

          retryableFailureCount += 1;

          if (recipient.transport === "WEB") {
            aggregate.webRetryableFailureCount += 1;
          } else {
            aggregate.nativeRetryableFailureCount += 1;
          }
        },
      );
    } catch (error: unknown) {
      callFailureRecipientCount += chunk.length;
      retryableFailureCount += chunk.length;

      for (const recipient of chunk) {
        if (recipient.transport === "WEB") {
          aggregate.webCallFailureCount += 1;
        } else {
          aggregate.nativeCallFailureCount += 1;
        }
      }

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
    emitAggregateOnce("FAILED_CALL");

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

  emitAggregateOnce(status);

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
