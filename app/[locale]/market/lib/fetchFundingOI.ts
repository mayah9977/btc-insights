export async function fetchFundingOI(symbol: string) {
  const formatted = symbol.replace(" / ", "");

  const [fundingRes, oiRes] = await Promise.all([
    fetch(
      `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${formatted}`,
      { next: { revalidate: 10 } } // 10초 캐싱
    ),
    fetch(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${formatted}&period=5m&limit=2`,
      { next: { revalidate: 10 } }
    ),
  ]);

  const fundingData = await fundingRes.json();
  const oiData = await oiRes.json();

  const funding = Number(fundingData.lastFundingRate);

  const prevOI = Number(oiData[0]?.sumOpenInterest);
  const currOI = Number(oiData[1]?.sumOpenInterest);

  const oiChangePercent =
    ((currOI - prevOI) / prevOI) * 100;

  return {
    funding,
    openInterestChange: oiChangePercent,
  };
}
