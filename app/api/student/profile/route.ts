import { z } from 'zod';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { calculateProfileCompleteness } from '@/lib/profileCompleteness';

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
  availabilityStatus: z.string().max(40).optional(),
  onboardingCompleted: z.boolean().optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredEmploymentTypes: z.array(z.string()).optional()
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const [profile, userDoc] = await Promise.all([
      StudentProfile.findOne({ userId: user.userId }).lean(),
      User.findById(user.userId).lean()
    ]);
    if (!profile) throw new ApiError('Profile not found', 404);
    const mergedProfile = {
      ...profile,
      university: (profile as any).university || (userDoc as any)?.university || '',
      city: (profile as any).city || (userDoc as any)?.city || '',
      bio: (profile as any).bio || (userDoc as any)?.bio || ''
    };
    const completeness = calculateProfileCompleteness(mergedProfile as any);
    return ok({ ...mergedProfile, completeness });
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
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: user.userId },
      payload,
      { new: true, upsert: true }
    );
    return ok(profile);
  });
}
