import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role === 'STUDENT') {
    const items = await prisma.application.findMany({ where: { studentId: user.id }, include: { project: true } });
    return NextResponse.json({ items });
  }
  if (user.role === 'CLIENT') {
    const items = await prisma.application.findMany({ where: { project: { clientId: user.id } }, include: { student: true, project: true } });
    return NextResponse.json({ items });
  }
  const items = await prisma.application.findMany();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const created = await prisma.application.create({ data: { ...body, studentId: user.id } });
  return NextResponse.json(created);
}
