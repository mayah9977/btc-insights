// app/api/admin/vip/user/[userId]/route.ts

import { NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';
import { readUsageLogs } from '@/lib/vip/vipUsageLog';
import { readChurnLogs } from '@/lib/vip/vipChurn';
import { inferRetentionReason } from '@/lib/vip/vipRetention';

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _req: Request,
  { params }: Context
) {
  const { userId } = await params;

  return NextResponse.json({
    audit: readAudits().filter((a) => a.userId === userId),
    usage: readUsageLogs(userId),
    churn: readChurnLogs().filter((c) => c.userId === userId),
    retention: inferRetentionReason(userId),
  });
}
