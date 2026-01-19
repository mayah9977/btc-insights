'use client'

import html2canvas from 'html2canvas'

export function useVipDailySnapshot() {
  const capture = async (targetId: string) => {
    const el = document.getElementById(targetId)
    if (!el) return

    const canvas = await html2canvas(el, {
      backgroundColor: '#0b0b0f',
      scale: 2,
    })

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `VIP_Daily_Snapshot_${new Date()
      .toISOString()
      .slice(0, 10)}.png`
    link.click()
  }

  return { capture }
}
