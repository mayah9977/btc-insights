import { NextResponse } from 'next/server'
import { rankUsersByAI } from '@/lib/ai/aiUserRanking'

export async function GET() {
  // DEV 기준 (실서비스에서는 전체 유저)
  const users = ['dev-user', 'user-2', 'user-3']

  return NextResponse.json(
    await rankUsersByAI(users)
  )
}
