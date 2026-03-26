import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [users, students, clients, projects, applications] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { role: 'STUDENT' } }), prisma.user.count({ where: { role: 'CLIENT' } }), prisma.project.count(), prisma.application.count()
  ]);
  return NextResponse.json({ users, students, clients, projects, applications });
}
