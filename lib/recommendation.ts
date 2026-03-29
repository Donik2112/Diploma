import Project from '@/models/Project';
import { getProfileReadiness } from '@/lib/profileReadiness';

export type RecommendInput = {
  skills: string[];
  experience: string;
  city?: string;
  interests?: string[];
  summary?: string;
  educationTrack?: string;
  completenessPercent?: number;
  top_n?: number;
  strict_city?: boolean;
};

function toReadiness(input: RecommendInput) {
  return getProfileReadiness({
    skills: input.skills,
    interests: input.interests,
    city: input.city,
    experienceLevel: input.experience,
    completenessPercent: input.completenessPercent
  });
}

function attachUiMeta(recommendations: any[], ready: boolean) {
  return recommendations.map((r: any) => ({
    ...r,
    showMatchScore: ready,
    uiLabel: ready
      ? `${r.matchScorePercent ?? Math.round((r.matchScore || 0) * 100)}% match`
      : 'Preliminary'
  }));
}

export async function getRecommendations(input: RecommendInput) {
  const profileReadiness = toReadiness(input);
  const ready = profileReadiness.recommendationMode === 'ready';
  const url = process.env.PYTHON_RECOMMENDER_URL;

  if (profileReadiness.recommendationMode === 'blocked') {
    return {
      source: 'Profile completion required',
      hasEnoughSignals: false,
      profileReadiness,
      recommendations: []
    };
  }

  if (url) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (response.ok) {
      const recommendations = await response.json();
      return {
        source: ready ? 'Personalized recommendations' : 'Preliminary recommendations',
        hasEnoughSignals: ready,
        profileReadiness,
        recommendations: attachUiMeta(recommendations, ready).map((r: any) => ({
          ...r,
          explanation: ready
            ? (r.explanation || 'Why this fits: profile and project signals are aligned.')
            : 'Based on limited profile data. Add more details to unlock accurate matching.'
        }))
      };
    }
  }

  const projects = await Project.find({ status: 'OPEN' }).limit(200).lean();
  const normalizedSkills = input.skills.map((s) => s.toLowerCase());
  const scored = projects.map((p: any) => {
    const matchedSkills = (p.requiredSkills || []).filter((skill: string) => normalizedSkills.includes(skill.toLowerCase()));
    const skillScore = matchedSkills.length / Math.max((p.requiredSkills || []).length, 1);
    const expScore = p.experienceLevel === input.experience ? 0.2 : 0;
    const cityScore = input.city && p.city === input.city ? 0.1 : 0;
    const score = Math.min(1, skillScore * 0.7 + expScore + cityScore);
    const whyFits = [
      matchedSkills.length ? `Why this fits: ${matchedSkills.slice(0, 3).join(', ')}` : '',
      expScore ? 'experience aligned' : '',
      cityScore ? 'city match' : ''
    ].filter(Boolean).join(' • ');

    return {
      projectId: p._id.toString(),
      title: p.title,
      matchScore: score,
      matchScorePercent: Math.round(score * 100),
      explanation: ready ? (whyFits || 'Why this fits: baseline profile + project signals.') : 'Based on limited profile data.'
    };
  }).filter((x) => x.matchScore > 0.05).sort((a, b) => b.matchScore - a.matchScore).slice(0, input.top_n || 10);

  const recommendations = attachUiMeta(scored, ready);
  const uniqueScores = new Set(recommendations.map((r: any) => r.matchScorePercent)).size;
  const normalizedRecommendations = ready && uniqueScores <= 1
    ? recommendations.map((r: any) => ({ ...r, showMatchScore: false, uiLabel: 'Low-confidence match' }))
    : recommendations;

  return {
    source: ready ? 'Personalized recommendations' : 'Preliminary recommendations',
    hasEnoughSignals: ready,
    profileReadiness,
    recommendations: normalizedRecommendations
  };
}
