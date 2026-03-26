import { handleApi, ok, ApiError } from '@/lib/api';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  return handleApi(async () => {
    const user = getUserFromCookie();
    if (!user) throw new ApiError('Unauthorized', 401);
    return ok(user);
  });
}
