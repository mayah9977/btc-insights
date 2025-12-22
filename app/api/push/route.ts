import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, body } = await req.json();

  // 실제로는 Firebase / OneSignal 연동
  console.log("🔔 PUSH:", title, body);

  return NextResponse.json({ ok: true });
}
