// lib/db.ts

import { Pool } from 'pg'

const isWorker = process.env.DB_RUNTIME === 'worker'

const connectionString = isWorker
  ? process.env.WORKER_POSTGRES_URL
  : process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error(
    isWorker
      ? 'WORKER_POSTGRES_URL is not defined'
      : 'POSTGRES_URL is not defined',
  )
}

const globalForPg = globalThis as unknown as {
  pgPool?: Pool
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}
