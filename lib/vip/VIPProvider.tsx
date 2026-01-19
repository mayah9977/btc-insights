'use client'

import type { ReactNode } from 'react'

import { WhaleHistoryProvider } from '@/app/[locale]/casino/lib/whaleHistoryStore'
import { WhaleFrequencyProvider } from '@/app/[locale]/casino/lib/whaleFrequencyStore'
import { WhaleHeatmapFocusProvider } from '@/app/[locale]/casino/lib/whaleHeatmapFocusStore'
import { DangerZoneLogProvider } from '@/app/[locale]/casino/lib/dangerZoneLogStore'

import { VIPNotificationProvider } from '@/app/[locale]/casino/lib/vipNotificationStore'
import { ExtremeThemeProvider } from '@/app/[locale]/casino/lib/extremeThemeStore'

export default function VIPProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <WhaleHistoryProvider>
      <WhaleFrequencyProvider>
        <DangerZoneLogProvider>
          <WhaleHeatmapFocusProvider>
            <VIPNotificationProvider>
              <ExtremeThemeProvider>
                {children}
              </ExtremeThemeProvider>
            </VIPNotificationProvider>
          </WhaleHeatmapFocusProvider>
        </DangerZoneLogProvider>
      </WhaleFrequencyProvider>
    </WhaleHistoryProvider>
  )
}
