'use client';

import { WhaleHistoryProvider } from '../lib/whaleHistoryStore';
import { WhaleFrequencyProvider } from '../lib/whaleFrequencyStore';
import { WhaleHeatmapFocusProvider } from '../lib/whaleHeatmapFocusStore';
import { DangerZoneLogProvider } from '../lib/dangerZoneLogStore';

import { VIPNotificationProvider } from '../lib/vipNotificationStore';
import { ExtremeThemeProvider } from '../lib/extremeThemeStore';

export default function VIPProviders({
  children,
}: {
  children: React.ReactNode;
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
  );
}
