"use client";

import { useEffect } from "react";

export default function EntryButton({ aiScore }: { aiScore: number }) {
  useEffect(() => {
    if (aiScore >= 85) {
      const audio = new Audio("/sounds/alert.mp3");
      audio.play();
    }
  }, [aiScore]);

  if (aiScore < 85) return null;

  return (
    <button
      className="
        mt-4 w-full py-3 rounded-xl font-bold text-black
        bg-yellow-400 animate-pulse
        shadow-[0_0_20px_rgba(255,215,0,0.9)]
      "
    >
      🔥 ENTRY NOW
    </button>
  );
}
