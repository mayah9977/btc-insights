// app/[locale]/layout.tsx
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await import(`../messages/${locale}.json`);
  } catch {
    notFound();
  }

  return <>{children}</>;
}
