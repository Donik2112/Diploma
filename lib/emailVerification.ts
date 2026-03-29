import { createHash } from 'crypto';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export type VerifyEmailResult = {
  success: boolean;
  error?: string;
};

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  if (!token) {
    return { success: false, error: 'Invalid or expired verification link' };
  }

  try {
    await dbConnect();

    const tokenHash = hashToken(token);
    const user: any = await User.findOne({
      emailVerificationToken: tokenHash
    });

    if (!user) {
      return { success: false, error: 'Invalid or expired verification link' };
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return { success: false, error: 'Invalid or expired verification link' };
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return { success: true };
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error);
    return { success: false, error: 'Could not verify email' };
  }
}
