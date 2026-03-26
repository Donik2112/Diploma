import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'sfm_token';

export type AuthToken = {
  userId: string;
  role: 'STUDENT' | 'CLIENT' | 'ADMIN';
  email: string;
};

export function signToken(payload: AuthToken) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as AuthToken;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parsed = verifyToken(token);
  if (!parsed) return null;
  return prisma.user.findUnique({ where: { id: parsed.userId }, include: { studentProfile: true, clientProfile: true } });
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}
