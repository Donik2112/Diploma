import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'This verification link is invalid or has expired' },
        { status: 400 }
      );
    }

    await dbConnect();
    const tokenHash = hashToken(token);
    const user: any = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'This verification link is invalid or has expired' },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return NextResponse.json({ success: true, data: { message: 'Your email has been verified successfully' } });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'This verification link is invalid or has expired' },
      { status: 500 }
    );
  }
}
