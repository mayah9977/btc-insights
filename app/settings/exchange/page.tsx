"use client";

import { useState } from "react";

export default function ExchangeSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");

  async function connect() {
    setStatus("Connecting...");

    const res = await fetch("/api/exchange/binance", {
      method: "POST",
      body: JSON.stringify({ apiKey, secret }),
    });

    if (res.ok) {
      setStatus("✅ Connected (Read-Only)");
    } else {
      setStatus("❌ Invalid API Key");
    }
  }

  return (
    <main className="max-w-md p-6 space-y-4">
      <h1 className="text-xl font-bold">
        Binance Read-Only 연결
      </h1>

      <input
        className="w-full p-2 border"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <input
        className="w-full p-2 border"
        placeholder="Secret Key"
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />

      <button
        onClick={connect}
        className="w-full bg-black text-white p-2"
      >
        Connect (Read-Only)
      </button>

      <p>{status}</p>
    </main>
  );
}
