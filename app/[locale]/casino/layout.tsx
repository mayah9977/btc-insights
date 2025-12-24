import type { ReactNode } from 'react';

/* 🔐 VIP (SSOT) */
import { getUserVIPLevel } from '@/lib/vip/vipServer';
import VIPRealtimeRoot from '@/lib/vip/VIPRealtimeRoot'; // ✅ default import
import type { VIPLevel } from './lib/vipAccess';

/* 🎨 Providers */
import { VIPLevelProvider } from './lib/vipLevelStore';
import { ExtremeThemeProvider } from './lib/extremeThemeStore';
import { WhaleHistoryProvider } from './lib/whaleHistoryStore';
import { WhaleFrequencyProvider } from './lib/whaleFrequencyStore';
import { WhaleHeatmapFocusProvider } from './lib/whaleHeatmapFocusStore';
import { DangerZoneLogProvider } from './lib/dangerZoneLogStore';
import { VIPNotificationProvider } from './lib/vipNotificationStore';

/* 🔔 Notification */
import { NotificationConsumer } from '@/components/notifications/NotificationConsumer';

/* 📡 Client UI */
import { CasinoRealtimeUI } from './CasinoRealtimeUI';

export default async function CasinoLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userId = 'dev-user';
  const vipLevel: VIPLevel = await getUserVIPLevel(userId);

  return (
    <VIPRealtimeRoot initialLevel={vipLevel}>
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
                    <NotificationConsumer />
                    <CasinoRealtimeUI vipLevel={vipLevel} />
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
