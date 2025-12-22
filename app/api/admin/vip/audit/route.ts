// app/api/admin/vip/audit/route.ts
import { NextResponse } from 'next/server';
import { readAudits } from '@/lib/vip/vipAuditStore';

export async function GET() {
  const logs = readAudits(300);
  return NextResponse.json(logs);
}
