export async function fetchMultiExchange(symbol: string) {
  const formatted = symbol.replace(" / ", "");

  const [binance, bybit] = await Promise.all([
    fetch(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${formatted}`
    ).then((r) => r.json()),
    fetch(
      `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${formatted}`
    ).then((r) => r.json()),
  ]);

  return {
    fundingAvg:
      (Number(binance.lastFundingRate) +
        Number(bybit.result.list[0].fundingRate)) / 2,
    divergence:
      Math.abs(
        Number(binance.lastFundingRate) -
          Number(bybit.result.list[0].fundingRate)
      ),
  };
}
