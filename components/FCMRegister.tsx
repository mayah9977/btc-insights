//components/FCMRegister.tsx

"use client";

import { useCallback, useState } from "react";

import {
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import { getFirebaseApp } from "@/lib/firebase-config";

/**
 * 사용법
 * 1) 페이지/컴포넌트에서
 *    <FCMRegister />
 *    를 배치하면 버튼 렌더
 *
 * 2) 기존 버튼에서
 *    requestPermissionAndRegister()
 *    직접 호출 가능
 */

type Props = {
  topics?: string[];
  label?: string;
};

export default function FCMRegister({
  topics = ["all"],
  label = "🔔 알림 허용",
}: Props) {
  const [loading, setLoading] =
    useState(false);

  const onClick = useCallback(
    async () => {
      if (loading) return;

      setLoading(true);

      try {
        await requestPermissionAndRegister(
          topics,
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, topics],
  );

  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-md border text-sm"
      disabled={loading}
      aria-busy={loading}
    >
      {loading
        ? "등록 중..."
        : label}
    </button>
  );
}

/**
 * 외부 직접 호출용
 */
export async function requestPermissionAndRegister(
  topics: string[] = ["all"],
) {
  try {
    /**
     * Service Worker 지원 여부
     */
    if (
      !("serviceWorker" in navigator)
    ) {
      alert(
        "이 브라우저는 Service Worker를 지원하지 않습니다.",
      );

      return;
    }

    /**
     * FCM 지원 여부
     */
    const supported =
      await isSupported().catch(
        () => false,
      );

    if (!supported) {
      alert(
        "현재 환경에서는 FCM 웹 푸시가 지원되지 않습니다.",
      );

      return;
    }

    /**
     * SW 등록
     */
    const reg =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        },
      );

    await navigator.serviceWorker.ready;

    /**
     * 알림 권한 요청
     */
    const perm =
      await Notification.requestPermission();

    if (perm !== "granted") {
      alert(
        "알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.",
      );

      return;
    }

    /**
     * Firebase App 가져오기
     */
    const app =
      getFirebaseApp();

    /**
     * Messaging 생성
     */
    const messaging =
      getMessaging(app);

    /**
     * VAPID KEY
     */
    const vapidKey =
      process.env
        .NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      alert(
        "VAPID 키가 없습니다. .env.local의 NEXT_PUBLIC_FIREBASE_VAPID_KEY 를 확인하세요.",
      );

      return;
    }

    /**
     * FCM TOKEN 발급
     */
    const token = await getToken(
      messaging,
      {
        vapidKey,

        serviceWorkerRegistration:
          reg,
      },
    );

    if (!token) {
      alert(
        "FCM 토큰을 받지 못했습니다.",
      );

      return;
    }

    /**
     * 서버 등록
     */
    const res = await fetch(
      "/api/push/register",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          token,
          topics,
        }),
      },
    );

    const json =
      await res.json().catch(
        () => ({} as any),
      );

    if (
      !res.ok ||
      !json?.ok
    ) {
      alert(
        `등록 실패: ${json?.err || res.status}`,
      );

      return;
    }

    console.log(
      "[register] ok:",
      json,
    );

    console.log(
      "[register] token:",
      token,
    );

    alert(
      "모바일 푸시 등록 완료!",
    );
  } catch (e: any) {
    console.error(
      "[FCM register] error:",
      e,
    );

    alert(
      `등록 중 오류: ${
        e?.message || String(e)
      }`,
    );
  }
}
