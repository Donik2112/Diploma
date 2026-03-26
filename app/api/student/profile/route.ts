import { z } from 'zod';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({
  university: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(500).optional(),
  about: z.string().max(2000).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  certificates: z.array(z.string()).optional(),
  portfolioLinks: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  experienceLevel: z.string().max(40).optional(),
  availabilityStatus: z.string().max(40).optional()
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const profile = await StudentProfile.findOne({ userId: user.userId }).lean();
    if (!profile) throw new ApiError('Profile not found', 404);
    return ok(profile);
  });
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const payload = schema.parse(await req.json());
    await User.findByIdAndUpdate(user.userId, {
      university: payload.university,
      city: payload.city,
      bio: payload.bio
    });
    const profile = await StudentProfile.findOneAndUpdate({ userId: user.userId }, payload, { new: true, upsert: true });
    return ok(profile);
  });
}
