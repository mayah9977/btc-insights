// app/api/vip/daily-report/route.ts

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: false,
      message: 'daily-report API is disabled',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  )
}
