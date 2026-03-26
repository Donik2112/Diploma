import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';

const schema = z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(6), role: z.enum(['STUDENT','CLIENT']) });

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDB();
    if (await User.findOne({ email: body.email })) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ ...body, passwordHash });
    if (body.role === 'STUDENT') await StudentProfile.create({ userId: user._id, skills: [], interests: [], certificates: [], portfolioLinks: [], availabilityStatus: 'AVAILABLE' });
    else await ClientProfile.create({ userId: user._id, companyName: `${body.fullName} Studio` });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
