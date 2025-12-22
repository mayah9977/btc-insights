// app/api/account/pnl/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  /**
   * 실제 Binance 연동 전까지는 MOCK
   * 반드시 JSON만 반환해야 함
   */
  return NextResponse.json({
    pnlRate: 0.12, // +12% 수익
    updatedAt: Date.now(),
  });
}
