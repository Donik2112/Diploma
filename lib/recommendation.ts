import Project from '@/models/Project';

export type RecommendInput = {
  skills: string[];
  experience: string;
  city?: string;
  interests?: string[];
  summary?: string;
  educationTrack?: string;
  top_n?: number;
  strict_city?: boolean;
};

const MIN_SUMMARY_LENGTH = 80;

function hasEnoughSignals(input: RecommendInput) {
  const summaryLength = (input.summary || '').trim().length;
  return (
    (input.skills || []).length >= 3 &&
    (input.interests || []).length >= 1 &&
    !!(input.city || '').trim() &&
    summaryLength >= MIN_SUMMARY_LENGTH &&
    (!!(input.educationTrack || '').trim() || !!(input.experience || '').trim())
  );
}

export async function getRecommendations(input: RecommendInput) {
  const enoughSignals = hasEnoughSignals(input);
  const url = process.env.PYTHON_RECOMMENDER_URL;
  if (url) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (response.ok) {
      const recommendations = await response.json();
      return {
        source: enoughSignals ? 'Personalized recommendations' : 'Starter recommendations',
        hasEnoughSignals: enoughSignals,
        recommendations: recommendations.map((r: any) => ({
          ...r,
          showMatchScore: enoughSignals,
          uiLabel: enoughSignals ? `${r.matchScorePercent ?? Math.round((r.matchScore || 0) * 100)}% match` : 'Preliminary recommendation',
          explanation: enoughSignals
            ? (r.explanation || 'Why this fits: profile and project signals are aligned.')
            : 'Based on your education and activity. Add skills, interests, city, and summary to unlock accurate matching.'
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
      matchedSkills.length ? `Matched skills: ${matchedSkills.slice(0, 3).join(', ')}` : '',
      expScore ? 'Experience level aligned' : '',
      cityScore ? 'City match' : ''
    ].filter(Boolean).join(' • ');

    return {
      projectId: p._id.toString(),
      title: p.title,
      matchScore: score,
      matchScorePercent: Math.round(score * 100),
      showMatchScore: enoughSignals,
      uiLabel: enoughSignals ? `${Math.round(score * 100)}% match` : 'Preliminary recommendation',
      explanation: enoughSignals
        ? (whyFits || 'Why this fits: category and baseline profile signals.')
        : 'Based on your education and activity. Add skills, interests, city, and summary to unlock accurate matching.'
    };
  }).filter((x) => x.matchScore > 0.05).sort((a, b) => b.matchScore - a.matchScore).slice(0, input.top_n || 10);

  return {
    source: enoughSignals ? 'Personalized recommendations' : 'Starter recommendations',
    hasEnoughSignals: enoughSignals,
    recommendations: scored
  };
}
