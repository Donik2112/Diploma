import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

const secret = process.env.JWT_SECRET || 'dev_secret';
const issuer = 'uniwork-platform';

export type AuthPayload = {
  userId: string;
  role: 'STUDENT' | 'CLIENT' | 'ADMIN';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  tokenType?: 'access' | 'refresh'
};

export function signAccessToken(payload: Omit<AuthPayload, 'tokenType'>) {
  return jwt.sign({ ...payload, tokenType: 'access' }, secret, { expiresIn: '1d', issuer, audience: 'web' });
}

export function signRefreshToken(payload: Omit<AuthPayload, 'tokenType'>) {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, secret, { expiresIn: '7d', issuer, audience: 'web' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret, { issuer, audience: 'web' }) as AuthPayload;
  } catch {
    return null;
  }
}

export function getUserFromCookie() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.tokenType !== 'access') return null;
  return payload;
}

export function requireAuth(roles?: AuthPayload['role'][]) {
  const user = getUserFromCookie();
  if (!user) throw new ApiError('Unauthorized', 401);
  if (roles && !roles.includes(user.role)) throw new ApiError('Forbidden', 403);
  return user;
}

export async function requireApprovedStudent(user: AuthPayload) {
  if (user.role !== 'STUDENT') return;
  await dbConnect();
  const row: any = await User.findById(user.userId).select('approvalStatus').lean();
  if (!row || row.approvalStatus !== 'APPROVED') throw new ApiError('Your account is under review by admin.', 403);
}
