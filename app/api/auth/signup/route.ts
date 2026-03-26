import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';

const schema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain letters and numbers'),
  role: z.enum(['STUDENT', 'CLIENT'])
});

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = schema.parse(await req.json());

    if (await User.findOne({ email: body.email })) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ ...body, passwordHash });

    if (body.role === 'STUDENT') {
      await StudentProfile.create({
        userId: user._id,
        skills: [],
        interests: [],
        certificates: [],
        portfolioLinks: [],
        availabilityStatus: 'AVAILABLE',
        experienceLevel: 'JUNIOR'
      });
    } else {
      await ClientProfile.create({
        userId: user._id,
        companyName: `${body.fullName} Studio`,
        companyDescription: '',
        website: '',
        industry: ''
      });
    }

    return NextResponse.json({ success: true, data: { userId: user._id.toString() } }, { status: 201 });
  } catch (error: any) {
    console.error('SIGNUP ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
