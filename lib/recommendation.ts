import { prisma } from '@/lib/prisma';

export type RecommendInput = {
  skills: string[];
  experience: string;
  city?: string;
  interests?: string[];
  top_n?: number;
  strict_city?: boolean;
  studentId?: string;
};

export async function getRecommendations(input: RecommendInput) {
  const topN = input.top_n ?? 10;
  const sourceModel = process.env.PYTHON_RECOMMENDER_URL ? 'ML API' : 'fallback demo engine';

  if (process.env.PYTHON_RECOMMENDER_URL) {
    try {
      const response = await fetch(`${process.env.PYTHON_RECOMMENDER_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (response.ok) {
        const data = await response.json();
        return { sourceModel, items: data.items ?? [] };
      }
    } catch {
      // fallback below
    }
  }

  const projects = await prisma.project.findMany({ where: { status: 'OPEN' }, include: { client: true }, take: 50 });
  const scored = projects
    .map((project) => {
      const skillOverlap = project.requiredSkills.filter((s) => input.skills.map((k) => k.toLowerCase()).includes(s.toLowerCase())).length;
      const interestOverlap = (input.interests ?? []).filter((i) => project.category.toLowerCase().includes(i.toLowerCase())).length;
      const cityScore = input.city && project.city === input.city ? 0.2 : input.strict_city ? -1 : 0;
      const expScore = project.experienceLevel === input.experience ? 0.2 : 0.1;
      const raw = skillOverlap * 0.25 + interestOverlap * 0.2 + cityScore + expScore;
      const score = Math.max(0, Math.min(1, raw));
      return {
        projectId: project.id,
        title: project.title,
        city: project.city,
        category: project.category,
        score,
        scorePercent: Math.round(score * 100),
        explanation: `Matched ${skillOverlap} required skills, experience fit: ${project.experienceLevel === input.experience ? 'high' : 'medium'}.`,
        project
      };
    })
    .filter((r) => !input.strict_city || !input.city || r.city === input.city)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  if (input.studentId) {
    await prisma.recommendationLog.createMany({
      data: scored.map((s) => ({
        studentId: input.studentId as string,
        projectId: s.projectId,
        score: s.score,
        sourceModel
      }))
    });
  }

  return { sourceModel, items: scored };
}
