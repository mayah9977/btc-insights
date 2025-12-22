"use client";

import { useEffect, useState } from "react";

export function useRealtimePNL() {
  const [pnl, setPNL] = useState(0);

  useEffect(() => {
    fetch("/api/account/listenKey")
      .then((r) => r.json())
      .then(({ listenKey }) => {
        const ws = new WebSocket(
          `wss://fstream.binance.com/ws/${listenKey}`
        );

        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.e === "ACCOUNT_UPDATE") {
            const p = d.a.P.reduce(
              (s: number, p: any) => s + Number(p.up),
              0
            );
            setPNL(p);
          }
        };
      });
  }, []);

  return pnl;
}
