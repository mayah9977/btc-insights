import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ locale: "ko" }];
}

export default function LocalePage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/casino`);
}
