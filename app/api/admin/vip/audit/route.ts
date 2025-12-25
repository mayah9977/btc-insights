// app/api/admin/vip/audit/route.ts
import { NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? 200);

  const audits = readAudits(limit);

  return NextResponse.json({
    ok: true,
    data: audits,
  });
}
