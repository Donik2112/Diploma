import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string; applicationId: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CLIENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { status } = await req.json();
  const app = await prisma.application.update({ where: { id: params.applicationId, projectId: params.id }, data: { status } as any });
  return NextResponse.json(app);
}
