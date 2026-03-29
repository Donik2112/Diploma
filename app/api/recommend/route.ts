import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';
import { getProfileReadiness } from '@/lib/profileReadiness';

export const dynamic = 'force-dynamic';

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function getProfileCompletionHints(profile: any) {
  return getProfileReadiness(profile).missingFields;
}

function extractRecommendations(raw: any): any[] {
  if (Array.isArray(raw?.recommendations)) return raw.recommendations;
  if (Array.isArray(raw?.data?.recommendations)) return raw.data.recommendations;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ML_API_URL = process.env.ML_API_URL;

    console.log('ML_API_URL =', ML_API_URL || 'undefined');

    if (!ML_API_URL) {
      return NextResponse.json(
        { error: 'ML_API_URL is not configured' },
        { status: 500 }
      );
    }

    const authUser = getUserFromCookie();
    let profile: any = null;

    if (authUser?.role === 'STUDENT') {
      await dbConnect();
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const payload = {
      skills: body.skills || toStringList(profile?.skills).join(', '),
      interests: body.interests || toStringList(profile?.interests).join(', '),
      experience: body.experience || profile?.experienceLevel || 'JUNIOR',
      employment: body.employment || '',
      city: body.city || profile?.city || '',
      top_n: Number(body.top_n || 10),
    };

    const profileReadiness = getProfileReadiness(profile);
    const missing = getProfileCompletionHints(profile);

    if (authUser?.role === 'STUDENT' && profileReadiness.recommendationMode === 'blocked') {
      return NextResponse.json({
        success: true,
        source: 'ML API',
        warnings: [
          'Complete your profile to get personalized recommendations.',
        ],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let mlRes: Response;
    try {
      mlRes = await fetch(`${ML_API_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const mlData = await mlRes.json().catch(() => null);

    if (!mlRes.ok) {
      console.error('ML service returned error:', mlData);
      return NextResponse.json(
        {
          error: 'ML request failed',
          details: mlData,
        },
        { status: mlRes.status }
      );
    }

    const recommendations = extractRecommendations(mlData);

    return NextResponse.json({
      success: true,
      source: 'ML API',
      warnings: missing.length
        ? [`Profile is incomplete: missing ${missing.join(', ')}`]
        : [],
      data: mlData,
      recommendations,
      profileReadiness,
      ...mlData,
    });
  } catch (error: any) {
    console.error('Recommend route error:', error);

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'ML request timed out' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'ML request failed',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
