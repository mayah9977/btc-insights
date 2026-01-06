export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-vipBg text-white">
      {children}
    </div>
  )
}
