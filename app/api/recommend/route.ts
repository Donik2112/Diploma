import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

function getProfileCompletionHints(profile: any) {
  const missing: string[] = [];
  if (!profile?.skills?.length) missing.push('skills');
  if (!profile?.city) missing.push('city');
  if (!profile?.experienceLevel) missing.push('experienceLevel');
  if (!profile?.interests?.length) missing.push('interests');
  return missing;
}

function normalizeRecommendations(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.recommendations)) return raw.recommendations;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ML_API_URL = process.env.ML_API_URL;
    console.log('ML_API_URL =', ML_API_URL || 'undefined');
    if (!ML_API_URL) {
      return NextResponse.json({ error: 'ML_API_URL is not configured' }, { status: 500 });
    }

    const authUser = getUserFromCookie();
    let profile: any = null;
    if (authUser?.role === 'STUDENT') {
      await dbConnect();
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const payload = {
      skills: body.skills || toStringList(profile?.skills).join(', '),
      experience: body.experience || profile?.experienceLevel || 'JUNIOR',
      employment: body.employment || '',
      city: body.city || profile?.city || '',
      interests: body.interests || toStringList(profile?.interests).join(', '),
      top_n: body.top_n || 10,
      strict_city: body.strict_city || false
    };

    const missing = getProfileCompletionHints(profile);
    console.log('Calling ML /recommend endpoint...');
    const mlRes = await fetch(`${ML_API_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const mlData = await mlRes.json().catch(() => ({}));
    if (!mlRes.ok) {
      console.error('Recommend route error: ML API non-200', { status: mlRes.status, mlData });
      return NextResponse.json(
        { error: 'ML request failed', details: mlData },
        { status: mlRes.status }
      );
    }

    const normalized = normalizeRecommendations(mlData);
    return NextResponse.json({
      success: true,
      source: 'ML API',
      warnings: missing.length ? [`Profile is incomplete: missing ${missing.join(', ')}`] : [],
      data: { recommendations: normalized, source: 'ML API', warnings: missing },
      recommendations: normalized
    });
  } catch (error) {
    console.error('Recommend route error:', error);
    return NextResponse.json(
      { error: 'ML request failed', details: String(error) },
      { status: 500 }
    );
  }
}
