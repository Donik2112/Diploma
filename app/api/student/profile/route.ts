import { z } from 'zod';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { calculateProfileCompleteness, getProfileReadiness } from '@/lib/profileReadiness';

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

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();

    const [profileRaw, userRaw] = await Promise.all([
      StudentProfile.findOne({ userId: user.userId }).lean(),
      User.findOne({ _id: user.userId }).lean()
    ]);

    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    const userDoc = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    if (!userDoc) throw new ApiError('User not found', 404);

    const mergedProfile = {
      userId: user.userId,
      university: profile?.university || userDoc?.university || '',
      city: profile?.city || userDoc?.city || '',
      bio: profile?.bio || userDoc?.bio || '',
      about: profile?.about || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      certificates: profile?.certificates || [],
      portfolioLinks: profile?.portfolioLinks || [],
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      experienceLevel: profile?.experienceLevel || 'JUNIOR',
      availabilityStatus: profile?.availabilityStatus || 'AVAILABLE',
      fullName: userDoc?.fullName || ''
    };

    const readiness = getProfileReadiness(mergedProfile);
    return ok({
      ...mergedProfile,
      completion: calculateProfileCompleteness(mergedProfile),
      profileReadiness: readiness,
    });
  });
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const payload = schema.parse(await req.json());

    const [userRaw, profileRaw] = await Promise.all([
      User.findOneAndUpdate(
        { _id: user.userId },
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

    const userDoc = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    if (!profile || !userDoc) {
      console.error('PROFILE SAVE ERROR: profile or user missing after update', { userId: user.userId });
      throw new ApiError('Failed to persist student profile', 500);
    }

    const mergedProfile = {
      ...profile.toObject(),
      fullName: userDoc.fullName || '',
      completion: calculateProfileCompleteness(profile),
      profileReadiness: getProfileReadiness(profile),
    };

    return ok(mergedProfile);
  });
}
