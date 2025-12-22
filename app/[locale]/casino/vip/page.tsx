// app/[locale]/casino/vip/page.tsx
import { redirect } from 'next/navigation';
import VIPClientPage from './vipClientPage';
import { calcVIPLevel } from '../lib/vipAccess';

type PageProps = {
  params: { locale: string };
};

export default async function VIPPage({ params }: PageProps) {
  const vipLevel = calcVIPLevel({
    hasPayment: true,
    daysUsed: 20,
    roi: 12,
  });

  if (vipLevel === 'FREE') {
    redirect(`/${params.locale}/login`);
  }

  return <VIPClientPage vipLevel={vipLevel} />;
}
