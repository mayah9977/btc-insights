//worker/pushRetryWorker.ts

import { processPushQueue } from '@/lib/push/pushQueue'

setInterval(processPushQueue, 10_000)


