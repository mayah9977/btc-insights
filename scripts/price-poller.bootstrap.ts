import path from 'path'
import dotenv from 'dotenv'

// ✅ dotenv를 가장 먼저 실행
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
})

// ✅ 그 다음에 poller 로직 로드
import './price-poller'
