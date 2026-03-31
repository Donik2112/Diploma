export type JobRecommendation = {
  project_id?: string;
  job_title?: string;
  title?: string;
  skills?: string;
  text?: string;
  experience_level?: string;
  employment_type?: string;
  city?: string;
  category?: string;
  budget_min?: number;
  budget_max?: number;
  salary?: string;
  job_family?: string;
  candidate_similarity?: number;
  rank_score?: number;
  final_score?: number;
  final_score_percent?: number;
  confidence?: number;
  ml_confidence?: number;
  matched_skills?: string[];
  reason_short?: string;
  match_reason?: string;
  predicted_family?: string;
};

export function extractRecommendations(payload: any): JobRecommendation[] {
  const rows =
    payload?.data?.recommendations ??
    payload?.recommendations ??
    payload?.data ??
    [];
  return Array.isArray(rows) ? rows : [];
}

export function extractSecondaryRecommendations(payload: any): JobRecommendation[] {
  const rows =
    payload?.data?.secondary_recommendations ??
    payload?.secondaryRecommendations ??
    [];
  return Array.isArray(rows) ? rows : [];
}

export function getScoreRange(items: JobRecommendation[]) {
  const scores = items
    .map((item) => Number(item.final_score_percent ?? item.final_score))
    .filter((value) => Number.isFinite(value));

  if (!scores.length) {
    return { minScore: NaN, maxScore: NaN };
  }

  return {
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
  };
}

export function scoreToPercent(
  score: number,
  minScore: number,
  maxScore: number
): number {
  if (!Number.isFinite(score)) return 0;

  if (score > 1.0001) return Math.round(score);

  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
    return Math.round(score * 100);
  }

  if (maxScore <= minScore) return Math.round(score * 100);

  const normalized = (score - minScore) / (maxScore - minScore);
  return Math.round(55 + normalized * 45);
}

export function canRenderMatchPercent(minScore: number, maxScore: number) {
  return Number.isFinite(minScore) && Number.isFinite(maxScore);
}

export function trimDescription(text: string, maxLength = 240) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function toEnglishRecommendationText(rec: JobRecommendation) {
  const base =
    String(rec.reason_short || rec.match_reason || '').trim() ||
    'This recommendation is based on your profile relevance and project requirements.';

  return base
    .replace(/\b(pochemu|почему|совпад|подходит|рекоменд)/gi, 'match')
    .replace(/\s+/g, ' ')
    .trim();
}
