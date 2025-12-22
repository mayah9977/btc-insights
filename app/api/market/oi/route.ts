import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();

  try {
    const url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${encodeURIComponent(
      symbol
    )}`;

    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, symbol, error: `Binance response ${r.status}` },
        { status: 502 }
      );
    }

    const data = await r.json();
    const openInterest = Number(data?.openInterest ?? 0);

    return NextResponse.json({
      ok: true,
      symbol,
      openInterest,
      ts: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, symbol, error: e?.message || "unknown error" },
      { status: 500 }
    );
  }
}
