import { z } from 'zod';
import Application from '@/models/Application';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireApprovedStudent, requireAuth } from '@/lib/auth';

const createSchema = z.object({
  projectId: z.string().min(8),
  coverLetter: z.string().min(20).max(2000),
  proposedPrice: z.coerce.number().min(0),
  estimatedDuration: z.string().min(2).max(120)
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth();
    await requireApprovedStudent(user);
    await dbConnect();
    const filter = user.role === 'STUDENT' ? { studentId: user.userId } : {};
    const rows = await Application.find(filter).sort({ createdAt: -1 }).lean();
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT']);
    await requireApprovedStudent(user);
    await dbConnect();
    const payload = createSchema.parse(await req.json());
    const app = await Application.create({ ...payload, studentId: user.userId, status: 'SENT' });
    return ok(app, 201);
  });
}
