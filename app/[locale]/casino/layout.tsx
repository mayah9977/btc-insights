import type { ReactNode } from 'react';

/* 🔐 VIP (SSOT) */
import { getUserVIPLevel } from '@/lib/vip/vipServer';
import { VIPRealtimeRoot } from '@/lib/vip/VIPRealtimeRoot';

/* 🎨 Providers */
import { VIPLevelProvider } from './lib/vipLevelStore';
import { ExtremeThemeProvider } from './lib/extremeThemeStore';
import { WhaleHistoryProvider } from './lib/whaleHistoryStore';
import { WhaleFrequencyProvider } from './lib/whaleFrequencyStore';
import { WhaleHeatmapFocusProvider } from './lib/whaleHeatmapFocusStore';
import { DangerZoneLogProvider } from './lib/dangerZoneLogStore';
import { VIPNotificationProvider } from './lib/vipNotificationStore';

/* 🔔 Notification Consumer */
import { NotificationConsumer } from '@/components/notifications/NotificationConsumer';

/* 🧠 Client Realtime UI */
import { CasinoRealtimeUI } from './CasinoRealtimeUI';

import type { VIPLevel } from './lib/vipAccess';

export default async function CasinoLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userId = 'dev-user';
  const vipLevel: VIPLevel = await getUserVIPLevel(userId);
  const extremeForced = vipLevel === 'VIP3';

  return (
    <VIPRealtimeRoot initialLevel={vipLevel}>
      <VIPLevelProvider
        vipLevel={vipLevel}
        extremeForced={extremeForced}
      >
        <ExtremeThemeProvider>
          <WhaleHistoryProvider>
            <WhaleFrequencyProvider>
              <DangerZoneLogProvider>
                <WhaleHeatmapFocusProvider>
                  <VIPNotificationProvider>
                    {/* 🔔 알림 소비 (전역 1회) */}
                    <NotificationConsumer />

                    {/* 📡 Realtime UI */}
                    <CasinoRealtimeUI vipLevel={vipLevel} />

                    {/* 📄 페이지 콘텐츠 */}
                    {children}
                  </VIPNotificationProvider>
                </WhaleHeatmapFocusProvider>
              </DangerZoneLogProvider>
            </WhaleFrequencyProvider>
          </WhaleHistoryProvider>
        </ExtremeThemeProvider>
      </VIPLevelProvider>
    </VIPRealtimeRoot>
  );
}
