import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendation';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const payload = {
    skills: body.skills || user?.studentProfile?.skills || [],
    experience: body.experience || user?.studentProfile?.experienceLevel || 'Junior',
    city: body.city || user?.city,
    interests: body.interests || user?.studentProfile?.interests || [],
    top_n: Number(body.top_n || 10),
    strict_city: Boolean(body.strict_city),
    studentId: user?.role === 'STUDENT' ? user.id : undefined
  };
  const result = await getRecommendations(payload);
  return NextResponse.json(result);
}
