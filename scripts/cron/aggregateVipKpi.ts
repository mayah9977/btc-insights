import 'dotenv/config'   // 🔥 이 줄 추가 (최상단)

import { aggregateDailyVipKpi } from '../../lib/vip/redis/aggregateVipKpi.ts'

async function run() {
  console.log('[VIP KPI] aggregation start')

  try {
    await aggregateDailyVipKpi()
    console.log('[VIP KPI] aggregation done')
  } catch (e) {
    console.error('[VIP KPI] aggregation failed', e)
  } finally {
    process.exit(0)
  }
}

run()
