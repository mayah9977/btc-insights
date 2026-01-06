import type { ReactNode } from 'react'

/* 🔐 VIP (Server) */
import { getUserVIPLevel } from '@/lib/vip/vipServer'
import VIPRealtimeRoot from '@/lib/vip/VIPRealtimeRoot'
import type { VIPLevel } from '@/lib/vip/vipTypes'

/* 🐋 Providers (⚠️ 모두 ./lib 기준) */
import { WhaleTriggerProvider } from './lib/whaleTriggerStore'
import { VIPLevelProvider } from './lib/vipLevelStore'
import { ExtremeThemeProvider } from './lib/extremeThemeStore'
import { WhaleHistoryProvider } from './lib/whaleHistoryStore'
import { WhaleFrequencyProvider } from './lib/whaleFrequencyStore'
import { WhaleHeatmapFocusProvider } from './lib/whaleHeatmapFocusStore'
import { DangerZoneLogProvider } from './lib/dangerZoneLogStore'
import { VIPNotificationProvider } from './lib/vipNotificationStore'

/* 🔔 UI */
import { NotificationConsumer } from '@/components/notifications/NotificationConsumer'
import { CasinoRealtimeUI } from './CasinoRealtimeUI'

export default async function CasinoLayout({
  children,
}: {
  children: ReactNode
}) {
  const userId = 'dev-user'
  const vipLevel: VIPLevel = await getUserVIPLevel(userId)

  return (
    <VIPRealtimeRoot initialLevel={vipLevel}>
      <WhaleTriggerProvider>
        <VIPLevelProvider
          vipLevel={vipLevel}
          extremeForced={vipLevel === 'VIP3'}
        >
          <ExtremeThemeProvider>
            <WhaleHistoryProvider>
              <WhaleFrequencyProvider>
                <DangerZoneLogProvider>
                  <WhaleHeatmapFocusProvider>
                    <VIPNotificationProvider>
                      <div className="min-h-screen w-full flex flex-col bg-vipBg">
                        <NotificationConsumer />

                        {/* Sticky Realtime Header */}
                        <CasinoRealtimeUI vipLevel={vipLevel} />

                        {/* Content */}
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
        </VIPLevelProvider>
      </WhaleTriggerProvider>
    </VIPRealtimeRoot>
  )
}
