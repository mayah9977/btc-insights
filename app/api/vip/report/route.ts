import { NextResponse } from 'next/server';

let reports: any[] = [];
let version = 1;

export async function GET() {
  return NextResponse.json(reports);
}

export async function POST(req: Request) {
  const body = await req.json();

  reports.push({
    ...body,
    version: version++,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const i = Number(searchParams.get('i'));
  reports.splice(i, 1);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const i = Number(searchParams.get('i'));
  const body = await req.json();

  if (reports[i]) {
    reports[i].tag = body.tag;
  }
  return NextResponse.json({ ok: true });
}
