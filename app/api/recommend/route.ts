import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { getRecommendations } from '@/lib/recommendation';
import RecommendationLog from '@/models/RecommendationLog';
import { handleApi, ok } from '@/lib/api';
import { getUserFromCookie, requireApprovedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  skills: z.array(z.string()).default([]),
  experience: z.string().default('JUNIOR'),
  city: z.string().optional(),
  interests: z.array(z.string()).optional(),
  summary: z.string().optional(),
  educationTrack: z.string().optional(),
  completenessPercent: z.coerce.number().min(0).max(100).optional(),
  top_n: z.coerce.number().min(1).max(30).default(10),
  strict_city: z.boolean().optional()
});

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = getUserFromCookie();
    if (user?.role === 'STUDENT') await requireApprovedStudent(user);
    await dbConnect();
    const input = schema.parse(await req.json());
    const result = await getRecommendations(input);
    if (user?.role === 'STUDENT') {
      await RecommendationLog.insertMany(result.recommendations.slice(0, 5).map((r: any) => ({ studentId: user.userId, projectId: r.projectId, score: r.matchScore, sourceModel: result.source })));
    }
    return ok(result);
  });
}
