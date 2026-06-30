"use client";


import SubscribeButton from "./SubscribeButton";

export default function PaidLock() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur">
      <div className="text-center space-y-4">
        <p className="text-lg font-bold text-white">
          🔒 Premium AI Signal
        </p>

        <p className="text-sm text-zinc-400">
          이 시그널은 유료 사용자만
          확인할 수 있습니다
        </p>

        <SubscribeButton />
      </div>
    </div>
  );
}
