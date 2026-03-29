import { z } from 'zod';
import type { SortOrder } from 'mongoose';
import { NextResponse } from 'next/server';
import Project from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(4000),
  category: z.string().min(2).max(80),
  requiredSkills: z.union([z.string(), z.array(z.string())]),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  deadline: z.string().optional(),
  city: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(40).optional(),
  experienceLevel: z.string().min(2).max(40).optional()
}).refine((v) => v.budgetMax >= v.budgetMin, 'budgetMax must be greater than or equal to budgetMin');

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city') || '';
    const experienceLevel = searchParams.get('experience') || '';
    const employmentType = searchParams.get('employment') || '';
    const sort = searchParams.get('sort') || 'newest';

    const filter: any = { status: 'OPEN', title: { $regex: q, $options: 'i' } };
    if (category) filter.category = category;
    if (city) filter.city = city;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (employmentType) filter.employmentType = employmentType;

    const sortQuery: Record<string, SortOrder> = sort === 'budget_asc'
      ? { budgetMin: 1 }
      : sort === 'budget_desc'
        ? { budgetMax: -1 }
        : { createdAt: -1 };

    const projects = await Project.find(filter).sort(sortQuery).limit(100).lean();
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    console.error('PROJECTS ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = requireAuth(['CLIENT', 'ADMIN']);
    const body = createSchema.parse(await req.json());

    const requiredSkills = Array.isArray(body.requiredSkills)
      ? body.requiredSkills
      : body.requiredSkills.split(',').map((x) => x.trim()).filter(Boolean);

    const project = await Project.create({
      clientId: user.userId,
      ...body,
      requiredSkills,
      deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000)
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    console.error('PROJECTS CREATE ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
