import { z } from 'zod';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  userId: z.string().min(8),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().max(500).optional()
});

export async function GET() {
  try {
    requireAuth(['ADMIN']);
    await dbConnect();
    const rows = await User.find({ role: 'STUDENT', approvalStatus: 'PENDING' })
      .select('fullName email university emailVerified approvalStatus createdAt')
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('ADMIN PENDING STUDENTS ERROR:', error);
    return NextResponse.json({ success: false, error: 'Failed to load pending students' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = requireAuth(['ADMIN']);
    await dbConnect();
    const body = updateSchema.parse(await req.json());
    const update =
      body.action === 'APPROVE'
        ? { approvalStatus: 'APPROVED', approvedAt: new Date(), approvedBy: admin.userId, rejectionReason: '' }
        : { approvalStatus: 'REJECTED', approvedAt: null, approvedBy: admin.userId, rejectionReason: body.rejectionReason || 'No reason provided' };

    const user = await User.findByIdAndUpdate(body.userId, update, { new: true });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { userId: user._id.toString(), approvalStatus: user.approvalStatus } });
  } catch (error) {
    console.error('ADMIN APPROVAL UPDATE ERROR:', error);
    return NextResponse.json({ success: false, error: 'Failed to update student approval status' }, { status: 500 });
  }
}
