import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';
import { getProfileReadiness } from '@/lib/profileReadiness';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

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

function toProjectText(project: any) {
  return {
    project_id: String(project?.id || ''),
    title: String(project?.title || ''),
    skills: Array.isArray(project?.requiredSkills)
      ? project.requiredSkills.join(', ')
      : '',
    text: String(project?.description || ''),
    experience_level: String(project?.experienceLevel || ''),
    employment_type: String(project?.employmentType || ''),
    city: String(project?.city || ''),
    category: String(project?.category || ''),
    budget_min: Number(project?.budgetMin ?? 0),
    budget_max: Number(project?.budgetMax ?? 0),
  };
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

    await dbConnect();

    if (authUser?.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const unifiedDataset = await loadUnifiedDataset();
    const openProjects = unifiedDataset.filter((item) => item.status === 'OPEN');
    console.log('[recommend] dataset summary', {
      unifiedItems: unifiedDataset.length,
      openItems: openProjects.length,
    });

    const profileSignals = {
      skills: toStringList(profile?.skills).length,
      interests: toStringList(profile?.interests).length,
      city: Boolean(profile?.city),
      experienceLevel: Boolean(profile?.experienceLevel),
    };
    console.log('[recommend] profile signals', profileSignals);

    const payload = {
      skills: body.skills || toStringList(profile?.skills).join(', '),
      interests: body.interests || toStringList(profile?.interests).join(', '),
      experience: body.experience || profile?.experienceLevel || 'JUNIOR',
      employment: body.employment || '',
      city: body.city || profile?.city || '',
      top_n: Number(body.top_n || 10),
      projects: openProjects.map(toProjectText),
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

    if (!openProjects.length) {
      return NextResponse.json({
        success: true,
        source: 'ML API',
        warnings: ['No open projects available for recommendations yet.'],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let mlRes: Response;
    try {
      mlRes = await fetch(`${ML_API_URL}/recommend-projects`, {
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
        ? ['Your profile can be strengthened for better recommendation quality.']
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
