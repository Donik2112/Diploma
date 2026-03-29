export type RecommendationMode = 'blocked' | 'preliminary' | 'ready';

export type ProfileReadinessInput = {
  skills?: string[];
  interests?: string[];
  city?: string;
  experienceLevel?: string;
  completenessPercent?: number;
};

export type ProfileReadiness = {
  completenessPercent: number;
  missingFields: string[];
  recommendationMode: RecommendationMode;
};

function normalizeCount(values?: string[]) {
  return (values || []).map((v) => (v || '').trim()).filter(Boolean).length;
}

export function getProfileReadiness(profile: ProfileReadinessInput): ProfileReadiness {
  const skillsCount = normalizeCount(profile.skills);
  const interestsCount = normalizeCount(profile.interests);
  const hasCity = Boolean((profile.city || '').trim());
  const hasExperience = Boolean((profile.experienceLevel || '').trim());

  const missingFields: string[] = [];
  if (skillsCount < 3) missingFields.push('skills (at least 3)');
  if (interestsCount < 1) missingFields.push('interests');
  if (!hasCity) missingFields.push('city');
  if (!hasExperience) missingFields.push('experience level');

  const signalCount = [skillsCount > 0, interestsCount > 0, hasCity, hasExperience].filter(Boolean).length;
  const ready = skillsCount >= 3 && interestsCount >= 1 && hasCity && hasExperience;

  let recommendationMode: RecommendationMode = 'blocked';
  if (ready) recommendationMode = 'ready';
  else if (signalCount >= 2) recommendationMode = 'preliminary';

  const computedPercent = Math.round(((skillsCount >= 3 ? 1 : 0) + (interestsCount >= 1 ? 1 : 0) + (hasCity ? 1 : 0) + (hasExperience ? 1 : 0)) / 4 * 100);

  return {
    completenessPercent: typeof profile.completenessPercent === 'number' ? profile.completenessPercent : computedPercent,
    missingFields,
    recommendationMode
  };
}
