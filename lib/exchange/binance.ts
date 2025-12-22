import { hmacSha256Hex } from "@/lib/crypto";

const BINANCE_API = "https://api.binance.com";

export type BinanceKeys = {
  apiKey: string;
  apiSecret: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * ✅ 서버에서만 사용하세요 (Route Handler / Server Action 등)
 * 읽기 전용 API Key라도 Secret은 절대 클라이언트로 내려가면 안 됩니다.
 */
export function getBinanceKeysFromEnv(): BinanceKeys {
  return {
    apiKey: mustGetEnv("BINANCE_API_KEY"),
    apiSecret: mustGetEnv("BINANCE_API_SECRET")
  };
}

async function signedGet<T>(
  keys: BinanceKeys,
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const timestamp = Date.now();
  const qs = new URLSearchParams(
    Object.entries({ ...params, timestamp }).map(([k, v]) => [k, String(v)])
  ).toString();

  const signature = hmacSha256Hex(keys.apiSecret, qs);
  const url = `${BINANCE_API}${path}?${qs}&signature=${signature}`;

  const res = await fetch(url, {
    headers: { "X-MBX-APIKEY": keys.apiKey },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Binance API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

/** 계정 정보(읽기) */
export async function getAccountInfo(keys: BinanceKeys) {
  return signedGet<any>(keys, "/api/v3/account");
}

/**
 * PnL은 Binance Spot 기본 API에 “단일 PnL”이 바로 나오지 않는 경우가 많아서,
 * 우선은 "잔고/포지션 기반 계산"으로 확장하는 방식으로 가는 게 안전합니다.
 * (선물 PnL이면 fapi 쪽을 써야 함)
 */
export async function getBalances(keys: BinanceKeys) {
  const account = await getAccountInfo(keys);
  return account?.balances ?? [];
}
