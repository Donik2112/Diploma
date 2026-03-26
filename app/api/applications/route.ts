import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Application from '@/models/Application';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  const user = getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const filter = user.role === 'STUDENT' ? { studentId: user.userId } : {};
  return NextResponse.json(await Application.find(filter).sort({ createdAt: -1 }).lean());
}

export async function POST(req: Request) {
  const user = getUserFromCookie();
  if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const app = await Application.create({ ...body, studentId: user.userId });
  return NextResponse.json(app);
}
