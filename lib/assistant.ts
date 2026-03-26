import { prisma } from '@/lib/prisma';

const templates: Record<string, string> = {
  'Help me complete my profile': 'Focus on skills, portfolio links, certifications, and a concise career goal. Add measurable achievements from coursework and internships.',
  'Suggest skills for my target role': 'For a junior full-stack role, prioritize TypeScript, React, Node.js, PostgreSQL, REST API design, testing, and Git workflow.',
  'Help me write a project description': 'Start with business goal, define user roles, list core features, add technical requirements, timeline, and expected deliverables.',
  'Explain why this project matches me': 'The match score reflects overlap between your skills and required skills, city preference fit, and experience-level compatibility.'
};

export async function askAssistant(prompt: string, userId?: string) {
  const response = templates[prompt] || 'I can help you with profile optimization, project writing, and recommendation interpretation. Please ask a specific question.';
  await prisma.assistantLog.create({ data: { userId, prompt, response } });
  return response;
}
