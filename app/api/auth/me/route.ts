import { handleApi, ok } from '@/lib/api';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    const user = getUserFromCookie();
    if (!user) return ok(null);
    await dbConnect();
    const userDoc: any = await User.findById(user.userId).lean();
    if (!userDoc) return ok(null);
    return ok({
      userId: user.userId,
      role: user.role,
      fullName: userDoc.fullName,
      email: userDoc.email,
      emailVerified: userDoc.emailVerified,
      approvalStatus: userDoc.approvalStatus || 'APPROVED',
      rejectionReason: userDoc.rejectionReason || null
    });
  });
}
