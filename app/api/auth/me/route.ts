import { handleApi, ok, ApiError } from '@/lib/api';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    await dbConnect();
    const user = getUserFromCookie();
    if (!user) throw new ApiError('Unauthorized', 401);
    const existingUser = await User.findById(user.userId).lean();
    if (!existingUser) throw new ApiError('Unauthorized', 401);
    return ok(user);
  });
}
