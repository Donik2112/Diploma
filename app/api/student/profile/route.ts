import { z } from 'zod';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const optionalString = (max: number) => z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().max(max).optional()
);

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().url('Please enter a valid URL').optional()
);

const normalizeArray = z.preprocess(
  (value) => {
    if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
    return [];
  },
  z.array(z.string())
);

const schema = z.object({
  university: optionalString(120),
  city: optionalString(80),
  bio: optionalString(500),
  about: optionalString(2000),
  skills: normalizeArray,
  interests: normalizeArray,
  certificates: normalizeArray,
  portfolioLinks: normalizeArray,
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  experienceLevel: optionalString(40),
  availabilityStatus: optionalString(40)
});

function calculateCompletion(profile: any) {
  const checks = [
    profile.university,
    profile.city,
    profile.bio,
    profile.about,
    profile.skills?.length ? 'ok' : '',
    profile.interests?.length ? 'ok' : '',
    profile.certificates?.length ? 'ok' : '',
    profile.portfolioLinks?.length ? 'ok' : '',
    profile.githubUrl,
    profile.linkedinUrl,
    profile.experienceLevel,
    profile.availabilityStatus
  ];
  const filled = checks.filter((x) => String(x || '').trim()).length;
  return Math.round((filled / checks.length) * 100);
}

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();

    const [profile, userDoc] = await Promise.all([
      StudentProfile.findOne({ userId: user.userId }).lean(),
      User.findById(user.userId).lean()
    ]);

    if (!userDoc) throw new ApiError('User not found', 404);

    const mergedProfile = {
      userId: user.userId,
      university: profile?.university || userDoc.university || '',
      city: profile?.city || userDoc.city || '',
      bio: profile?.bio || userDoc.bio || '',
      about: profile?.about || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      certificates: profile?.certificates || [],
      portfolioLinks: profile?.portfolioLinks || [],
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      experienceLevel: profile?.experienceLevel || 'JUNIOR',
      availabilityStatus: profile?.availabilityStatus || 'AVAILABLE',
      fullName: userDoc.fullName || ''
    };

    return ok({ ...mergedProfile, completion: calculateCompletion(mergedProfile) });
  });
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const payload = schema.parse(await req.json());

    const [userDoc, profile] = await Promise.all([
      User.findByIdAndUpdate(
        user.userId,
        { university: payload.university || '', city: payload.city || '', bio: payload.bio || '' },
        { new: true }
      ),
      StudentProfile.findOneAndUpdate(
        { userId: user.userId },
        {
          $set: {
            university: payload.university || '',
            city: payload.city || '',
            bio: payload.bio || '',
            about: payload.about || '',
            skills: payload.skills,
            interests: payload.interests,
            certificates: payload.certificates,
            portfolioLinks: payload.portfolioLinks,
            githubUrl: payload.githubUrl || '',
            linkedinUrl: payload.linkedinUrl || '',
            experienceLevel: payload.experienceLevel || 'JUNIOR',
            availabilityStatus: payload.availabilityStatus || 'AVAILABLE'
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    ]);

    if (!profile || !userDoc) {
      console.error('PROFILE SAVE ERROR: profile or user missing after update', { userId: user.userId });
      throw new ApiError('Failed to persist student profile', 500);
    }

    const mergedProfile = {
      ...profile.toObject(),
      fullName: userDoc.fullName || '',
      completion: calculateCompletion(profile)
    };

    return ok(mergedProfile);
  });
}
