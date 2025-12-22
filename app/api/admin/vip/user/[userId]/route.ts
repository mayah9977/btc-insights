import { NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';
import { readUsageLogs } from '@/lib/vip/vipUsageLog';
import { readChurnLogs } from '@/lib/vip/vipChurn';
import { inferRetentionReason } from '@/lib/vip/vipRetention';

export async function GET(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  return NextResponse.json({
    audit: readAudits().filter((a) => a.userId === userId),
    usage: readUsageLogs(userId),
    churn: readChurnLogs().filter((c) => c.userId === userId),
    retention: inferRetentionReason(userId),
  });
}
