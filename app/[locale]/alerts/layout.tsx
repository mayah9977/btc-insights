// app/[locale]/alerts/layout.tsx

import CreateAlertButton from './components/CreateAlertButton'

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {/* 콘텐츠 */}
      <div className="pt-[53px]">{children}</div>

      {/* 버튼 (layout 기준 고정) */}
      <CreateAlertButton />
    </div>
  )
}
