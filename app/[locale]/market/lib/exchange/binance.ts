import crypto from "crypto";

const BASE = process.env.BINANCE_API_BASE!;

function sign(query: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");
}

export async function fetchBinanceAccount(
  apiKey: string,
  secret: string
) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = sign(query, secret);

  const res = await fetch(
    `${BASE}/fapi/v2/account?${query}&signature=${signature}`,
    {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Binance API error");
  }

  return res.json();
}
