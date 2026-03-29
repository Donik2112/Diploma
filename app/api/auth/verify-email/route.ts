import { NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/emailVerification';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const result = await verifyEmailToken(token);

  if (!result.success) {
    const status = result.error === 'Could not verify email' ? 500 : 400;
    return NextResponse.json(
      { success: false, error: result.error || 'Invalid or expired verification link' },
      { status }
    );
  }

  return NextResponse.json({ success: true });
}
