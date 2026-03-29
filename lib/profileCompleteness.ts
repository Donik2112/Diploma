type ProfileLike = {
  university?: string;
  city?: string;
  about?: string;
  skills?: string[];
  interests?: string[];
  experienceLevel?: string;
  availabilityStatus?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioLinks?: string[];
  certificates?: string[];
};

const RULES: Array<{ key: keyof ProfileLike; label: string; weight: number; check: (profile: ProfileLike) => boolean }> = [
  { key: 'university', label: 'University', weight: 8, check: (p) => !!p.university },
  { key: 'city', label: 'City', weight: 8, check: (p) => !!p.city },
  { key: 'about', label: 'Professional summary', weight: 12, check: (p) => !!p.about },
  { key: 'skills', label: 'Skills', weight: 14, check: (p) => (p.skills || []).length > 0 },
  { key: 'interests', label: 'Interests', weight: 12, check: (p) => (p.interests || []).length > 0 },
  { key: 'experienceLevel', label: 'Experience level', weight: 10, check: (p) => !!p.experienceLevel },
  { key: 'availabilityStatus', label: 'Availability status', weight: 10, check: (p) => !!p.availabilityStatus },
  { key: 'githubUrl', label: 'GitHub URL', weight: 6, check: (p) => !!p.githubUrl },
  { key: 'linkedinUrl', label: 'LinkedIn URL', weight: 6, check: (p) => !!p.linkedinUrl },
  { key: 'portfolioLinks', label: 'Portfolio links', weight: 8, check: (p) => (p.portfolioLinks || []).length > 0 },
  { key: 'certificates', label: 'Certificates', weight: 6, check: (p) => (p.certificates || []).length > 0 }
];

export function calculateProfileCompleteness(profile: ProfileLike) {
  const total = RULES.reduce((acc, r) => acc + r.weight, 0);
  const earned = RULES.filter((r) => r.check(profile)).reduce((acc, r) => acc + r.weight, 0);
  const missingFields = RULES.filter((r) => !r.check(profile)).map((r) => r.label);
  const percent = Math.round((earned / total) * 100);
  const nextRecommendedAction = missingFields[0] ? `Add ${missingFields[0].toLowerCase()} to improve recommendations.` : 'Your profile is well optimized for recommendations.';
  return { percent, missingFields, nextRecommendedAction };
}
