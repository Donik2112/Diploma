import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getRecommendations } from '@/lib/recommendation';
import RecommendationLog from '@/models/RecommendationLog';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request) {
  await connectDB();
  const input = await req.json();
  const result = await getRecommendations(input);
  const user = getUserFromCookie();
  if (user?.role === 'STUDENT') {
    await RecommendationLog.insertMany(result.recommendations.slice(0, 5).map((r: any) => ({ studentId: user.userId, projectId: r.projectId, score: r.matchScore, sourceModel: result.source })));
  }
  return NextResponse.json(result);
}
