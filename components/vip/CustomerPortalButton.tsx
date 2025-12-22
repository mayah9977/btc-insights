'use client';

export default function CustomerPortalButton({
  customerId,
  locale,
}: {
  customerId: string;
  locale: string;
}) {
  const open = async () => {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      body: JSON.stringify({ customerId, locale }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return <button onClick={open}>구독 관리</button>;
}
