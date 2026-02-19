import { redirect } from "next/navigation";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ locale: "ko" }];
}

export default function LocalePage({
  params,
}: {
  params: { locale?: string };
}) {
  const locale = params?.locale ?? "ko";

  redirect(`/${locale}/casino`);
}
