import { calcOIDelta } from "./exchange/calcOIDelta";
import { detectOrderbookWhale } from "./exchange/detectOrderbookWhale";

type WhaleInput = {
  prevOI: number;
  currentOI: number;
  recentVolume: number;
  avgVolume: number;
};

export function detectWhale(input: WhaleInput): boolean {
  const oiDelta = calcOIDelta(input.prevOI, input.currentOI);
  const orderbookSpike = detectOrderbookWhale(
    input.recentVolume,
    input.avgVolume
  );

  return oiDelta >= 3 && orderbookSpike;
}
