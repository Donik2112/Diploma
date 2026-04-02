export type LegacyItem = {
  id: string;
  clientId?: string | null;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: string | null;
  city: string;
  employmentType: string;
  experienceLevel: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string | null;
  type: 'vacancy' | 'project';
  source?: string;
};

const EMPLOYMENT_MAP: Record<string, string> = {
  'Полная занятость': 'full-time',
  'Частичная занятость': 'part-time',
  'Проектная работа': 'project',
  'Стажировка': 'internship',
};

const EXPERIENCE_MAP: Record<string, string> = {
  'Нет опыта': 'junior',
  'От 1 года до 3 лет': 'middle',
  'От 3 до 6 лет': 'senior',
  'Более 6 лет': 'senior',
};

export function normalizeEmploymentType(value?: string | null): string {
  if (!value) return 'full-time';
  return EMPLOYMENT_MAP[value] || value.toLowerCase();
}

export function normalizeExperienceLevel(value?: string | null): string {
  if (!value) return 'middle';
  return EXPERIENCE_MAP[value] || 'middle';
}

export function inferCategory(text: string): string {
  const t = text.toLowerCase();

  if (/(react|vue|javascript|html|css|frontend)/i.test(t)) return 'Frontend';
  if (/(python|django|fastapi|flask|backend|api|node\.js|nodejs|express)/i.test(t)) return 'Backend';
  if (/(sql|analytics|analyst|power bi|excel|pandas|data analyst)/i.test(t)) return 'Data Analytics';
  if (/(airflow|etl|data engineer)/i.test(t)) return 'Data Engineering';
  if (/(docker|kubernetes|devops|ci\/cd|ansible)/i.test(t)) return 'DevOps';
  if (/(qa|test|selenium|testing)/i.test(t)) return 'QA';
  if (/(ml|machine learning|ai|llm|nlp|rag|transformers)/i.test(t)) return 'Machine Learning';

  return 'Other';
}

export function extractSkillNames(skills: unknown[] = []): string[] {
  return skills
    .map((skill) => {
      if (typeof skill === 'string') return skill;
      if (skill && typeof skill === 'object' && 'name' in skill) {
        return String((skill as { name?: unknown }).name || '');
      }
      return '';
    })
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function mapVacancyToLegacyCard(vacancy: Record<string, any>): LegacyItem {
  const title = String(vacancy?.title || '');
  const description = String(vacancy?.description_text || '');
  const requiredSkills = extractSkillNames(Array.isArray(vacancy?.key_skills) ? vacancy.key_skills : []);
  const searchableText = [title, description, ...requiredSkills].join(' ');

  return {
    id: String(vacancy?.id || vacancy?._id || ''),
    clientId: vacancy?.company?.id ? String(vacancy.company.id) : null,
    title,
    description,
    category: inferCategory(searchableText),
    requiredSkills,
    budgetMin: Number.isFinite(Number(vacancy?.salary?.from)) ? Number(vacancy.salary.from) : null,
    budgetMax: Number.isFinite(Number(vacancy?.salary?.to)) ? Number(vacancy.salary.to) : null,
    deadline: null,
    city: String(vacancy?.location?.city || 'Remote'),
    employmentType: normalizeEmploymentType(vacancy?.employment_type || vacancy?.employmentType || null),
    experienceLevel: normalizeExperienceLevel(vacancy?.experience_level || vacancy?.experienceLevel || null),
    status: vacancy?.closed_for_applicants ? 'CLOSED' : 'OPEN',
    createdAt: vacancy?.created_at || vacancy?.published_at || null,
    type: 'vacancy',
    source: String(vacancy?.source || 'hh.kz'),
  };
}

export function mapProjectToLegacyCard(project: Record<string, any>): LegacyItem {
  const difficulty = String(project?.difficulty || '').toLowerCase();
  const normalizedLevel = difficulty === 'easy' ? 'junior' : difficulty === 'medium' ? 'middle' : 'senior';

  return {
    id: String(project?.id || project?._id || ''),
    clientId: project?.related_vacancy_id ? String(project.related_vacancy_id) : null,
    title: String(project?.title || ''),
    description: String(project?.summary || project?.description || ''),
    category: String(project?.category || inferCategory(String(project?.title || '')) || 'Other'),
    requiredSkills: Array.isArray(project?.required_skills)
      ? project.required_skills.map((x: unknown) => String(x)).filter(Boolean)
      : Array.isArray(project?.requiredSkills)
        ? project.requiredSkills.map((x: unknown) => String(x)).filter(Boolean)
        : [],
    budgetMin: null,
    budgetMax: null,
    deadline: null,
    city: String(project?.city || 'Remote'),
    employmentType: 'project',
    experienceLevel: normalizedLevel,
    status: String(project?.status || 'OPEN').toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
    createdAt: project?.createdAt || null,
    type: 'project',
    source: String(project?.source || 'generated'),
  };
}
