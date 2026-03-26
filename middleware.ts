import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('token')?.value;
  const user = token ? verifyToken(token) : null;

  if (path.startsWith('/admin') && user?.role !== 'ADMIN') return NextResponse.redirect(new URL('/signin', req.url));
  if (path.startsWith('/client') && !['CLIENT', 'ADMIN'].includes(user?.role || '')) return NextResponse.redirect(new URL('/signin', req.url));
  if (path.startsWith('/student') && !['STUDENT', 'ADMIN'].includes(user?.role || '')) return NextResponse.redirect(new URL('/signin', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/student/:path*', '/client/:path*'] };
