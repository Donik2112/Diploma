import { cookies } from 'next/headers';
import { handleApi, ok, ApiError } from '@/lib/api';
import { signAccessToken, verifyToken } from '@/lib/auth';

export async function POST() {
  return handleApi(async () => {
    const refresh = cookies().get('refresh_token')?.value;
    if (!refresh) throw new ApiError('Refresh token is missing', 401);
    const payload = verifyToken(refresh);
    if (!payload || payload.tokenType !== 'refresh') throw new ApiError('Invalid refresh token', 401);

    const token = signAccessToken({ userId: payload.userId, role: payload.role });
    const response = ok({ refreshed: true });
    response.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return response;
  });
}
