export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-vipBg text-white flex items-center justify-center">
      <div className="bg-vipCard border border-vipBorder p-10 rounded-xl text-center space-y-4">
        <h1 className="text-2xl font-bold text-vipAccent">
          TAILWIND TEST OK ({locale.toUpperCase()})
        </h1>

        <p className="text-sm text-gray-400">
          bg-vipBg / vipCard / vipBorder 정상 적용
        </p>

        <p className="text-xs text-gray-500">
          locale = {locale}
        </p>
      </div>
    </div>
  );
}
