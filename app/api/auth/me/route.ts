import { handleApi, ok, ApiError } from '@/lib/api';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    const authUser = getUserFromCookie();
    if (!authUser) throw new ApiError('Unauthorized', 401);

    await dbConnect();
    const user: any = await User.findById(authUser.userId).select('role fullName email emailVerified');
    if (!user) throw new ApiError('Unauthorized', 401);

    return ok({
      userId: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      emailVerified: Boolean(user.emailVerified)
    });
  });
}
