import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';
import Project from '@/models/Project';
import { getProfileReadiness } from '@/lib/profileReadiness';

export const dynamic = 'force-dynamic';

const MIN_CONFIDENCE = Number(process.env.RECOMMEND_MIN_CONFIDENCE ?? 0.45);
const TOP_K = Number(process.env.RECOMMEND_TOP_K ?? 10);

type MlRec = {
  project_id?: string;
  title?: string;
  job_title?: string;
  category?: string;
  city?: string;
  experience_level?: string;
  employment_type?: string;
  text?: string;
  skills?: string;
  match_reason?: string;
  final_score?: number;
  final_score_percent?: number;
  candidate_similarity?: number;
  rank_score?: number;
  predicted_family?: string;
};

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function getProfileCompletionHints(profile: any) {
  return getProfileReadiness(profile).missingFields;
}

function extractRecommendations(raw: any): MlRec[] {
  const rows =
    raw?.recommendations ??
    raw?.data?.recommendations ??
    raw?.data ??
    raw;
  return Array.isArray(rows) ? rows : [];
}

function toProjectText(project: any) {
  return {
    project_id: String(project?._id || ''),
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

function overlap(a: string[], b: string[]) {
  const setA = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => setA.has(x.toLowerCase()));
}

function toConfidence(rec: MlRec) {
  const candidates = [
    Number(rec.final_score_percent),
    Number(rec.final_score),
    Number(rec.candidate_similarity),
    Number(rec.rank_score),
  ].filter((x) => Number.isFinite(x));

  if (!candidates.length) return 0;

  const normalized = candidates.map((v) => {
    if (v > 1) return Math.min(1, v / 100);
    if (v < 0) return 0;
    return v;
  });

  return Number((normalized.reduce((acc, v) => acc + v, 0) / normalized.length).toFixed(4));
}

function toEnglishReason(args: {
  matchedSkills: string[];
  cityAligned: boolean;
  experienceAligned: boolean;
  category?: string;
}) {
  const parts: string[] = [];
  if (args.matchedSkills.length) parts.push(`matched skills: ${args.matchedSkills.slice(0, 4).join(', ')}`);
  if (args.cityAligned) parts.push('city preference is aligned');
  if (args.experienceAligned) parts.push('experience level is aligned');
  if (args.category) parts.push(`category fit: ${args.category}`);

  return parts.length
    ? `Why this fits: ${parts.join('; ')}.`
    : 'Why this fits: ML signals indicate general relevance to your profile and preferences.';
}

function scoreWithProfile(args: {
  studentSkills: string[];
  profileCity: string;
  profileExperience: string;
  project: any;
  mlConfidence: number;
}) {
  const projectSkills = toStringList(args.project?.requiredSkills);
  const matchedSkills = overlap(args.studentSkills, projectSkills);
  const skillRatio = projectSkills.length ? matchedSkills.length / projectSkills.length : 0;

  const cityAligned =
    args.profileCity && args.project?.city
      ? args.profileCity.toLowerCase() === String(args.project.city).toLowerCase() || String(args.project.city).toLowerCase() === 'remote'
      : false;

  const experienceAligned =
    args.profileExperience && args.project?.experienceLevel
      ? args.profileExperience.toLowerCase() === String(args.project.experienceLevel).toLowerCase()
      : false;

  const hybrid = (args.mlConfidence * 0.55) + (skillRatio * 0.3) + (cityAligned ? 0.075 : 0) + (experienceAligned ? 0.075 : 0);

  return {
    hybridScore: Number(hybrid.toFixed(4)),
    matchedSkills,
    cityAligned,
    experienceAligned,
  };
}

function fallbackRecommendations(openProjects: any[], profile: any, topN: number) {
  const studentSkills = toStringList(profile?.skills);
  const city = normalizeText(profile?.city).toLowerCase();
  const exp = normalizeText(profile?.experienceLevel).toLowerCase();

  const ranked = openProjects.map((project) => {
    const projectSkills = toStringList(project.requiredSkills);
    const matchedSkills = overlap(studentSkills, projectSkills);
    const skillRatio = projectSkills.length ? matchedSkills.length / projectSkills.length : 0;
    const cityAligned = city && project.city ? city === String(project.city).toLowerCase() || String(project.city).toLowerCase() === 'remote' : false;
    const experienceAligned = exp && project.experienceLevel ? exp === String(project.experienceLevel).toLowerCase() : false;
    const score = (skillRatio * 0.7) + (cityAligned ? 0.15 : 0) + (experienceAligned ? 0.15 : 0);

    return {
      project_id: String(project._id),
      title: String(project.title || 'Project'),
      text: String(project.description || ''),
      city: String(project.city || ''),
      experience_level: String(project.experienceLevel || ''),
      employment_type: String(project.employmentType || ''),
      category: String(project.category || ''),
      budget_min: Number(project.budgetMin ?? 0),
      budget_max: Number(project.budgetMax ?? 0),
      final_score: score,
      final_score_percent: Math.round(score * 100),
      confidence: Number(score.toFixed(4)),
      matched_skills: matchedSkills,
      reason_short: toEnglishReason({
        matchedSkills,
        cityAligned,
        experienceAligned,
        category: String(project.category || ''),
      }),
    };
  });

  return ranked
    .filter((row) => row.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ML_API_URL = process.env.ML_API_URL;

    const authUser = getUserFromCookie();
    let profile: any = null;

    await dbConnect();

    if (authUser?.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const openProjects = await Project.find({ status: 'OPEN' })
      .select({
        _id: 1,
        title: 1,
        description: 1,
        requiredSkills: 1,
        city: 1,
        employmentType: 1,
        experienceLevel: 1,
        category: 1,
        budgetMin: 1,
        budgetMax: 1,
      })
      .lean();

    const profileReadiness = getProfileReadiness(profile);
    const missing = getProfileCompletionHints(profile);

    if (authUser?.role === 'STUDENT' && profileReadiness.recommendationMode === 'blocked') {
      return NextResponse.json({
        success: true,
        source: 'Profile incomplete',
        warnings: ['Complete your profile to get personalized recommendations.'],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    if (!openProjects.length) {
      return NextResponse.json({
        success: true,
        source: 'No open projects',
        warnings: ['No open projects available for recommendations yet.'],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    const payload = {
      skills: body.skills || toStringList(profile?.skills).join(', '),
      interests: body.interests || toStringList(profile?.interests).join(', '),
      experience: body.experience || profile?.experienceLevel || 'JUNIOR',
      employment: body.employment || '',
      city: body.city || profile?.city || '',
      top_n: Number(body.top_n || TOP_K),
      projects: openProjects.map(toProjectText),
    };

    const projectById = new Map(openProjects.map((p: any) => [String(p._id), p]));

    if (!ML_API_URL) {
      const fallback = fallbackRecommendations(openProjects, profile, payload.top_n);
      return NextResponse.json({
        success: true,
        source: 'Heuristic fallback',
        warnings: ['ML_API_URL is not configured. Fallback ranking is used.'],
        recommendations: fallback,
        data: { recommendations: fallback },
        profileReadiness,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let mlRes: Response | null = null;
    let mlData: any = null;

    try {
      mlRes = await fetch(`${ML_API_URL}/recommend-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal,
      });
      mlData = await mlRes.json().catch(() => null);
    } catch (error) {
      console.error('[recommend] ML request failed, fallback activated:', error);
    } finally {
      clearTimeout(timeout);
    }

    const mlRows = mlRes?.ok ? extractRecommendations(mlData) : [];
    console.log('[recommend] raw ML response:', JSON.stringify(mlData).slice(0, 3000));
    console.log('[recommend] raw ML response size:', Array.isArray(mlRows) ? mlRows.length : 0);

    const studentSkills = toStringList(profile?.skills);
    const profileCity = normalizeText(profile?.city);
    const profileExperience = normalizeText(profile?.experienceLevel);

    const mapped = mlRows
      .map((rec: MlRec) => {
        const projectId = normalizeText(rec.project_id);
        const project = projectById.get(projectId);
        if (!project) return null;

        const mlConfidence = toConfidence(rec);
        const scored = scoreWithProfile({
          studentSkills,
          profileCity,
          profileExperience,
          project,
          mlConfidence,
        });

        return {
          project_id: projectId,
          title: normalizeText(project.title || rec.title || rec.job_title || 'Project'),
          text: normalizeText(project.description || rec.text),
          city: normalizeText(project.city || rec.city),
          experience_level: normalizeText(project.experienceLevel || rec.experience_level),
          employment_type: normalizeText(project.employmentType || rec.employment_type),
          category: normalizeText(project.category || rec.category),
          budget_min: Number(project.budgetMin ?? 0),
          budget_max: Number(project.budgetMax ?? 0),
          final_score: scored.hybridScore,
          final_score_percent: Math.round(scored.hybridScore * 100),
          confidence: scored.hybridScore,
          ml_confidence: mlConfidence,
          matched_skills: scored.matchedSkills,
          predicted_family: normalizeText(rec.predicted_family),
          reason_short: toEnglishReason({
            matchedSkills: scored.matchedSkills,
            cityAligned: scored.cityAligned,
            experienceAligned: scored.experienceAligned,
            category: normalizeText(project.category || rec.category),
          }),
          match_reason: toEnglishReason({
            matchedSkills: scored.matchedSkills,
            cityAligned: scored.cityAligned,
            experienceAligned: scored.experienceAligned,
            category: normalizeText(project.category || rec.category),
          }),
        };
      })
      .filter(Boolean) as any[];

    console.log('[recommend] mapped project count:', mapped.length);

    const strong = mapped.filter((row) => row.confidence >= MIN_CONFIDENCE);
    const filteredOut = mapped.length - strong.length;
    console.log('[recommend] filtered low-confidence count:', filteredOut);

    const orderedStrong = strong.sort((a, b) => b.confidence - a.confidence).slice(0, payload.top_n);
    const secondary = mapped
      .filter((row) => row.confidence < MIN_CONFIDENCE)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, Math.max(0, payload.top_n - orderedStrong.length));

    let source = 'ML API';
    let warnings: string[] = [];

    let finalRecommendations = orderedStrong;
    let secondaryRecommendations = secondary;

    if (!mlRes?.ok || !mlRows.length || !mapped.length) {
      const fallback = fallbackRecommendations(openProjects, profile, payload.top_n);
      finalRecommendations = fallback;
      secondaryRecommendations = [];
      source = 'Heuristic fallback';
      warnings = ['ML response was unavailable or unmapped. Fallback ranking is shown.'];
    }

    if (!finalRecommendations.length) {
      warnings.push('No strong matches found. Update your skills/profile to unlock higher-confidence recommendations.');
    }

    if (missing.length) {
      warnings.push(`Profile is incomplete: missing ${missing.join(', ')}`);
    }

    console.log('[recommend] final rendered recommendations:', finalRecommendations.length);

    return NextResponse.json({
      success: true,
      source,
      warnings,
      data: {
        recommendations: finalRecommendations,
        secondary_recommendations: secondaryRecommendations,
      },
      recommendations: finalRecommendations,
      secondaryRecommendations,
      profileReadiness,
      ml: mlData,
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
