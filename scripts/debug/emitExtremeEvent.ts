import { redis } from '../../lib/redis/index.js'

async function run() {
  const event = {
    riskLevel: 'EXTREME',
    position: 'LONG',

    // 손실 계산용 가격 정보 (중요)
    entryPrice: 90000,
    worstPrice: 88500, // → 회피 손실 1500 USD

    timestamp: Date.now(),
    reason: 'TEST_EXTREME_EVENT',
  }

  await redis.lpush('vip:risk-events', JSON.stringify(event))

  console.log('[TEST] Extreme risk event inserted', event)

  process.exit(0)
}

run()
