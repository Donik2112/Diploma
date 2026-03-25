import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const projects = await prisma.project.findMany({ where: { status: 'OPEN', ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}) }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: projects });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CLIENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const project = await prisma.project.create({ data: { ...body, clientId: user.id, deadline: new Date(body.deadline), status: 'OPEN' } });
  return NextResponse.json(project);
}
