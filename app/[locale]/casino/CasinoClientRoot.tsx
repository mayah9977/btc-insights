'use client'

import type { ReactNode } from 'react'
// REMOVE: import { usePathname, useRouter } from 'next/navigation'

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

// REMOVE: Header Component
// REMOVE: BottomTab Component

/* =========================
   Main Root
========================= */
export default function CasinoClientRoot({
  initialLevel,
  children,
}: {
  initialLevel: VIPLevel
  children: ReactNode
}) {
  // REMOVE: const pathname = usePathname()
  // REMOVE: const isVIPPage = pathname?.startsWith('/casino/vip')

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

                      <main
                        className="
                          flex-1 relative z-0
                          pt-14
                          pb-20   // REMOVE: conditional logic 제거, 공통 layout 기준 유지
                        "
                      >
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
