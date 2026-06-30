"use client";

import { useEffect, useState } from "react";

export default function WhalePulse() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setShow(true);
      const audio = new Audio("/sounds/jackpot.mp3");
      audio.play();

      setTimeout(() => setShow(false), 4000);
    }, 15000); // 15초마다 심리 자극

    return () => clearInterval(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="
      fixed top-20 left-1/2 -translate-x-1/2
      bg-black text-yellow-400 px-6 py-3 rounded-full
      shadow-[0_0_30px_rgba(255,215,0,0.9)]
      animate-bounce z-50
    ">
      🐋 3 WHALES ARE ENTERING NOW
    </div>
  );
}
