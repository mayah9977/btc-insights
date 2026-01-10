import { NextRequest, NextResponse } from "next/server";
import { registerPushToken } from "@/lib/push/pushTokenStore";

/**
 * Client → Server Push Token Register
 * (인증 제거: 개발 / 테스트 단계)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json(
        { ok: false, error: "Missing userId or token" },
        { status: 400 }
      );
    }

    console.log("[API] registerPushToken", userId, token);

    await registerPushToken(userId, token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] registerPushToken error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
