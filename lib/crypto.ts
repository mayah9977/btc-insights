import crypto from "crypto";

/** Binance 서명용 HMAC SHA256 */
export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
