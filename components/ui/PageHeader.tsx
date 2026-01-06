// components/ui/PageHeader.tsx
export default function PageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-zinc-400 max-w-2xl">
          {description}
        </p>
      )}
    </header>
  )
}
