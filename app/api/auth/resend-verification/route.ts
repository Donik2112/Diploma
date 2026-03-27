import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/appUrl';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createVerificationToken() {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

export async function POST() {
  try {
    const authUser = requireAuth();

    await dbConnect();
    const user: any = await User.findById(authUser.userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, data: { message: 'Your email is already verified.' } });
    }

    const { rawToken, tokenHash, expiresAt } = createVerificationToken();
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpiresAt = expiresAt;
    await user.save();

    const appUrl = getAppUrl();
    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (error) {
      console.error('RESEND VERIFICATION EMAIL SEND ERROR:', error);
      console.log('EMAIL VERIFICATION FALLBACK URL:', verifyUrl);
    }

    return NextResponse.json({ success: true, data: { message: 'Verification email sent' } });
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.error('RESEND VERIFICATION ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Could not resend verification email. Please try again later' },
      { status: 500 }
    );
  }
}
