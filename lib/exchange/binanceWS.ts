// lib/exchange/binanceWS.ts

export function connectBinancePNLStream(
  listenKey: string,
  onUpdate: (pnl: number) => void
) {
  const ws = new WebSocket(
    `wss://fstream.binance.com/ws/${listenKey}`
  );

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.e === "ACCOUNT_UPDATE") {
      const totalPNL = data.a.P.reduce(
        (sum: number, p: any) => sum + Number(p.up),
        0
      );
      onUpdate(totalPNL);
    }
  };

  return () => ws.close();
}
