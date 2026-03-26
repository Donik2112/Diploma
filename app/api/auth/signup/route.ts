import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

const schema = z.object({
  firstName: z.string({ required_error: 'Enter your first name' }).trim()
    .min(1, 'Enter your first name')
    .min(2, 'First name must be at least 2 characters long')
    .max(60),
  lastName: z.string({ required_error: 'Enter your last name' }).trim()
    .min(1, 'Enter your last name')
    .min(2, 'Last name must be at least 2 characters long')
    .max(60),
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
  }),
  university: z.string({ required_error: 'Select your university' }).trim()
    .min(1, 'Select your university')
    .refine((v) => (KAZAKHSTAN_UNIVERSITIES as readonly string[]).includes(v), 'Select your university')
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
    const fullName = `${body.firstName} ${body.lastName}`.trim();

    if (await User.findOne({ email: body.email })) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      fullName,
      email: body.email,
      role: body.role,
      passwordHash,
      university: body.university,
      emailVerified: false
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
        companyName: `${fullName} Studio`,
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
