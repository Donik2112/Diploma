import Application from '@/models/Application';
import { connectDB } from '@/lib/db';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await connectDB();
    const rows = await Application.find({ projectId: params.id }).sort({ createdAt: -1 }).lean();
    return ok(rows);
  });
}
