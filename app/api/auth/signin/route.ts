import { z } from 'zod';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(128) });

export async function POST(req: Request) {
  return handleApi(async () => {
    const { email, password } = schema.parse(await req.json());
    await dbConnect();
    const user: any = await User.findOne({ email });
    if (!user) throw new ApiError('Invalid credentials', 401);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new ApiError('Invalid credentials', 401);
    if (!user.emailVerified) throw new ApiError('Please verify your email address before signing in', 403);

    const token = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

    const response = ok({ role: user.role, fullName: user.fullName });
    response.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    response.cookies.set('refresh_token', refreshToken, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return response;
  });
}
