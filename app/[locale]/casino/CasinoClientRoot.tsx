'use client'

import type { ReactNode } from 'react'

import VIPRealtimeRoot from '@/lib/vip/VIPRealtimeRoot'

/* 🐋 Providers */
import { WhaleTriggerProvider } from './lib/whaleTriggerStore'
import { ExtremeThemeProvider } from './lib/extremeThemeStore'
import { WhaleHistoryProvider } from './lib/whaleHistoryStore'
import { WhaleFrequencyProvider } from './lib/whaleFrequencyStore'
import { WhaleHeatmapFocusProvider } from './lib/whaleHeatmapFocusStore'
import { DangerZoneLogProvider } from './lib/dangerZoneLogStore'
import { VIPNotificationProvider } from './lib/vipNotificationStore'

/* 🔔 UI */
import { NotificationConsumer } from '@/components/notifications/NotificationConsumer'
import { CasinoRealtimeUI } from './CasinoRealtimeUI'
import type { VIPLevel } from '@/lib/vip/vipTypes'

export default function CasinoClientRoot({
  initialLevel,
  children,
}: {
  initialLevel: VIPLevel
  children: ReactNode
}) {
  return (
    <VIPRealtimeRoot initialLevel={initialLevel}>
      <WhaleTriggerProvider>
        <ExtremeThemeProvider>
          <WhaleHistoryProvider>
            <WhaleFrequencyProvider>
              <DangerZoneLogProvider>
                <WhaleHeatmapFocusProvider>
                  <VIPNotificationProvider>
                    <div className="min-h-screen w-full flex flex-col bg-vipBg">
                      <NotificationConsumer />
                      <CasinoRealtimeUI />
                      <main className="flex-1 relative z-0 pt-14">
                        {children}
                      </main>
                    </div>
                  </VIPNotificationProvider>
                </WhaleHeatmapFocusProvider>
              </DangerZoneLogProvider>
            </WhaleFrequencyProvider>
          </WhaleHistoryProvider>
        </ExtremeThemeProvider>
      </WhaleTriggerProvider>
    </VIPRealtimeRoot>
  )
}
