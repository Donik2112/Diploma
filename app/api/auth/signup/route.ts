import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';
import { handleApi, ok, ApiError } from '@/lib/api';

const schema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain letters and numbers'),
  role: z.enum(['STUDENT', 'CLIENT'])
});

export async function POST(req: Request) {
  return handleApi(async () => {
    const body = schema.parse(await req.json());
    await connectDB();
    if (await User.findOne({ email: body.email })) throw new ApiError('Email already exists', 409);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ ...body, passwordHash });

    if (body.role === 'STUDENT') {
      await StudentProfile.create({ userId: user._id, skills: [], interests: [], certificates: [], portfolioLinks: [], availabilityStatus: 'AVAILABLE', experienceLevel: 'JUNIOR' });
    } else {
      await ClientProfile.create({ userId: user._id, companyName: `${body.fullName} Studio`, companyDescription: '', website: '', industry: '' });
    }

    return ok({ userId: user._id.toString() }, 201);
  });
}
