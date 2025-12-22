import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const log = await req.json();

  console.log("📉 ENTRY FAILURE:", log);

  // 실제론 DB / BigQuery / S3
  return NextResponse.json({ ok: true });
}
