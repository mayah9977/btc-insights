import { NextResponse } from "next/server";

// ✅ 임시 스텁: 바이낸스 연동은 다음 단계(실계정 Read-Only)에서 구현
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Binance integration is not enabled yet. (stub route)",
    },
    { status: 200 }
  );
}
