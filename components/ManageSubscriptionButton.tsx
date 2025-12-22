'use client';

export default function ManageSubscriptionButton({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const openPortal = async () => {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, locale }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <button onClick={openPortal} className="rounded bg-gray-700 px-4 py-2 text-white">
      구독 관리
    </button>
  );
}
