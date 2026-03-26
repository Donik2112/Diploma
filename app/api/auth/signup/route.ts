import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['STUDENT', 'CLIENT']), city: z.string().optional() });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({ data: { fullName: body.fullName, email: body.email, passwordHash, role: body.role, city: body.city } });
    if (body.role === 'STUDENT') await prisma.studentProfile.create({ data: { userId: user.id, skills: [], experienceLevel: 'Junior', portfolioLinks: [], certificates: [], interests: [] } });
    if (body.role === 'CLIENT') await prisma.clientProfile.create({ data: { userId: user.id, companyName: `${body.fullName} Company`, companyDescription: 'Client account', industry: 'General Services' } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Validation or creation failed' }, { status: 400 });
  }
}
