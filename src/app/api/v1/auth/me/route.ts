import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
