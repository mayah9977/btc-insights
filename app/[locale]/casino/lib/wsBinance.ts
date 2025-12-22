import WebSocket from "ws";
import { updateRealtimeData } from "./wsStore";

export function startBinanceWS(symbol = "btcusdt") {
  const ws = new WebSocket(
    `wss://fstream.binance.com/ws/${symbol}@markPrice`
  );

  ws.on("message", (msg) => {
    const data = JSON.parse(msg.toString());

    updateRealtimeData({
      funding: Number(data.r),
      markPrice: Number(data.p),
      timestamp: Date.now(),
    });
  });

  ws.on("open", () => {
    console.log("🟢 Binance WS Connected");
  });

  ws.on("close", () => {
    console.log("🔴 Binance WS Closed → reconnecting");
    setTimeout(() => startBinanceWS(symbol), 3000);
  });
}
