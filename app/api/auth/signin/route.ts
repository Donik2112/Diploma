import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(128) });

export async function POST(req: Request) {
  try {
    const { email, password } = schema.parse(await req.json());
    await dbConnect();

    const user: any = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }


    if (user.approvalStatus === 'REJECTED') {
      return NextResponse.json(
        {
          success: false,
          error: user.rejectionReason
            ? `Your account was rejected: ${user.rejectionReason}`
            : 'Your account was rejected by admin.'
        },
        { status: 403 }
      );
    }

    const token = signAccessToken({ userId: user._id.toString(), role: user.role, approvalStatus: user.approvalStatus });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role, approvalStatus: user.approvalStatus });

    const response = NextResponse.json({
      success: true,
      data: {
        role: user.role,
        fullName: user.fullName,
        approvalStatus: user.approvalStatus || 'APPROVED'
      }
    });
    response.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    response.cookies.set('refresh_token', refreshToken, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return response;
  } catch (error) {
    console.error('SIGNIN ERROR:', error);
    return NextResponse.json({ success: false, error: 'Could not sign in. Please try again later' }, { status: 500 });
  }
}
