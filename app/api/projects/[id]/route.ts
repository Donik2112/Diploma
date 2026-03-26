import { z } from 'zod';
import Project from '@/models/Project';
import { connectDB } from '@/lib/db';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

const updateSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  category: z.string().min(2).max(80).optional(),
  requiredSkills: z.array(z.string()).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  deadline: z.string().optional(),
  city: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(40).optional(),
  experienceLevel: z.string().min(2).max(40).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    await connectDB();
    const project = await Project.findById(params.id).lean();
    if (!project) throw new ApiError('Project not found', 404);
    return ok(project);
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await connectDB();
    const payload = updateSchema.parse(await req.json());
    const updated = await Project.findByIdAndUpdate(params.id, payload, { new: true });
    if (!updated) throw new ApiError('Project not found', 404);
    return ok(updated);
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await connectDB();
    const deleted = await Project.findByIdAndDelete(params.id);
    if (!deleted) throw new ApiError('Project not found', 404);
    return ok({ removed: true });
  });
}
