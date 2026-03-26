import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const secret = process.env.JWT_SECRET || 'dev_secret';

export function signToken(payload: object) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try { return jwt.verify(token, secret) as { userId: string; role: string }; }
  catch { return null; }
}

export function getUserFromCookie() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
