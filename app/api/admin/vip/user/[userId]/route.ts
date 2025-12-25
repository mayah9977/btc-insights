import { NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';
import type { VIPAuditLog } from '@/lib/vip/vipAuditStore';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const audits = await readAudits(500);

  const filtered = audits.filter(
    (a: VIPAuditLog) => a.userId === params.userId
  );

  return NextResponse.json({
    userId: params.userId,
    audits: filtered,
  });
}
