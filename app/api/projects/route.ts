import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  await connectDB();
  const projects = await Project.find({ status: 'OPEN' }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const user = getUserFromCookie();
  if (!user || user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body: any = await req.json();
  await connectDB();
  const project = await Project.create({
    clientId: user.userId,
    ...body,
    requiredSkills: (body.requiredSkills || '').split(',').map((x: string) => x.trim()).filter(Boolean),
    budgetMin: Number(body.budgetMin || 0),
    budgetMax: Number(body.budgetMax || 0),
    deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000)
  });
  return NextResponse.json(project);
}
