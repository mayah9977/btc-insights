import { redis } from '../../lib/redis/index.js'

async function run() {
  await redis.del('vip:risk-events')
  await redis.del('vip:kpi:snapshot')

  console.log('[RESET] vip:risk-events cleared')
  console.log('[RESET] vip:kpi:snapshot cleared')

  process.exit(0)
}

run()
