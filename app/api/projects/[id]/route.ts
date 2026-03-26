import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const project = await Project.findById(params.id).lean();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = getUserFromCookie();
  if (!user || !['CLIENT', 'ADMIN'].includes(user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const updated = await Project.findByIdAndUpdate(params.id, await req.json(), { new: true });
  return NextResponse.json(updated);
}
