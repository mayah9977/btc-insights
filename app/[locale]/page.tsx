import { redirect } from "next/navigation";

export default async function LocalePage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/casino`);
}
