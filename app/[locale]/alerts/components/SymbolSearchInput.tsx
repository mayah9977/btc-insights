'use client'

type Props = {
  value: string
  onChange: (value: string) => void
}

export default function SymbolSearchInput({ value, onChange }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value.toUpperCase())}
      placeholder="코인 심볼 (예: BTCUSDT)"
      className="w-full border px-3 py-2 rounded"
    />
  )
}
