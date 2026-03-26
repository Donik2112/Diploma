import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';

const schema = z.object({
  fullName: z.string({ required_error: 'Enter your full name' }).trim()
    .min(1, 'Enter your full name')
    .max(120),
  email: z.string({ required_error: 'Enter your email' }).trim()
    .min(1, 'Enter your email')
    .email('Enter a valid email address'),
  password: z.string({ required_error: 'Enter a password' })
    .min(1, 'Enter a password')
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .max(128),
  role: z.enum(['STUDENT', 'CLIENT'], {
    required_error: 'Select a role',
    invalid_type_error: 'Select a role'
  })
});

export async function POST(req: Request) {
  try {
    await dbConnect();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message || 'Invalid request data', field: issue?.path?.[0] || undefined },
        { status: 400 }
      );
    }
    const body = parsed.data;

    if (await User.findOne({ email: body.email })) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      fullName: body.fullName,
      email: body.email,
      role: body.role,
      passwordHash
    });

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
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Could not create the account. Please try again later' },
      { status: 500 }
    );
  }
}
