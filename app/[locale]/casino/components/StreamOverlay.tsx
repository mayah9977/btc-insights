"use client";

import { motion } from "framer-motion";

export default function StreamOverlay({
  message,
}: {
  message: string;
}) {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-3 left-1/2 z-50
        -translate-x-1/2 rounded-full
        bg-black/80 px-6 py-2
        text-yellow-400 shadow-lg"
    >
      🔴 LIVE · {message}
    </motion.div>
  );
}
