import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  await prisma.user.update({ where: { id: user.id }, data: { university: body.university, city: body.city, bio: body.bio } });
  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { skills: body.skills || [], interests: body.interests || [], experienceLevel: body.experienceLevel || 'Junior', about: body.bio, availabilityStatus: body.availabilityStatus || 'AVAILABLE' },
    create: { userId: user.id, skills: body.skills || [], interests: body.interests || [], experienceLevel: body.experienceLevel || 'Junior', portfolioLinks: [], certificates: [], availabilityStatus: body.availabilityStatus || 'AVAILABLE' }
  });
  return NextResponse.json({ ok: true });
}
