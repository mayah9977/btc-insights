export function connectBinanceWS(
  symbol: string,
  onMessage: (data: any) => void
) {
  const ws = new WebSocket(
    `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@markPrice`
  );

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage({
      fundingRate: Number(data.r),
      price: Number(data.p),
    });
  };

  return () => ws.close();
}
