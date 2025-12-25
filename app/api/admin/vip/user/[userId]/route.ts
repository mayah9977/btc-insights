import { NextRequest, NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';
import type { VIPAuditLog } from '@/lib/vip/vipAuditStore';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  // ✅ await 추가 (핵심 수정)
  const audits = await readAudits(500);

  const filtered = audits.filter(
    (a: VIPAuditLog) => a.userId === userId
  );

  return NextResponse.json({
    userId,
    audits: filtered,
  });
}
