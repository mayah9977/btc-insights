"use client";

export default function SubscribeButton() {
  const handleClick = async () => {
    const res = await fetch("/api/payment/stripe/checkout", {
      method: "POST",
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <button
      onClick={handleClick}
      className="w-full mt-4 py-3 rounded-xl
      bg-gradient-to-r from-yellow-500 to-red-500
      text-black font-bold text-lg shadow-xl"
    >
      🔓 PRO 카지노 입장 ($19.99)
    </button>
  );
}
