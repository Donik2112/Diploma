import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { getUserFromCookie } from '@/lib/auth';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import Project from '@/models/Project';
import { calculateProfileCompleteness } from '@/lib/profileReadiness';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  action: z.enum([
    'why_recommended',
    'profile_improvement',
    'best_roles',
    'vacancy_analysis',
    'cover_letter',
  ]),
  projectId: z.string().optional(),
});

function normalizeList(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((v) => String(v).trim()).filter(Boolean);
  if (typeof input === 'string') return input.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function overlap(studentSkills: string[], projectSkills: string[]) {
  const studentSet = new Set(studentSkills.map((s) => s.toLowerCase()));
  return projectSkills.filter((skill) => studentSet.has(skill.toLowerCase()));
}

function recommendationScore(profile: any, project: any) {
  const studentSkills = normalizeList(profile?.skills);
  const projectSkills = normalizeList(project?.requiredSkills);
  const matchedSkills = overlap(studentSkills, projectSkills).length;

  const cityBonus =
    profile?.city && project?.city
      ? String(profile.city).toLowerCase() === String(project.city).toLowerCase() || String(project.city).toLowerCase() === 'remote'
        ? 2
        : 0
      : 0;

  const levelBonus =
    profile?.experienceLevel && project?.experienceLevel
      ? String(profile.experienceLevel).toLowerCase() === String(project.experienceLevel).toLowerCase()
        ? 2
        : 0
      : 0;

  return matchedSkills * 3 + cityBonus + levelBonus;
}

function inferBestRoles(projects: any[]) {
  const count: Record<string, number> = {};
  projects.forEach((p) => {
    const key = String(p?.category || 'General');
    count[key] = (count[key] || 0) + 1;
  });

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([role]) => role);
}

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
    }

    const authUser = getUserFromCookie();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const [userRaw, profileRaw] = await Promise.all([
      User.findById(authUser.userId).lean(),
      StudentProfile.findOne({ userId: authUser.userId }).lean(),
    ]);

    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!profile) {
      return NextResponse.json({
        answer:
          'Your student profile is not complete yet. Please fill in your skills, city, and experience level so I can provide better recommendations.',
        profileCompleteness: 0,
        action: parsed.data.action,
      });
    }

    const { action, projectId } = parsed.data;
    const studentSkills = normalizeList(profile.skills);
    const studentInterests = normalizeList(profile.interests);
    const completeness = calculateProfileCompleteness(profile as any);

    const topProjects = await Project.find({ status: 'OPEN' })
      .select({
        _id: 1,
        title: 1,
        category: 1,
        city: 1,
        requiredSkills: 1,
        experienceLevel: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const rankedProjects = topProjects
      .map((project) => ({ project, score: recommendationScore(profile, project) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.project);

    let selectedProject: any = null;
    if (projectId) {
      const selectedRaw = await Project.findById(projectId).lean();
      selectedProject = Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw;
      if (!selectedProject && (action === 'why_recommended' || action === 'vacancy_analysis' || action === 'cover_letter')) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    let answer = '';

    if (action === 'profile_improvement') {
      const suggestions: string[] = [];

      if (!profile.bio) suggestions.push('add a short professional bio');
      if (!profile.about) suggestions.push('describe your project experience and preferred project types');
      if (!studentSkills.length) suggestions.push('add technical skills relevant to your target roles');
      if (!studentInterests.length) suggestions.push('add your professional interests');
      if (!normalizeList(profile.portfolioLinks).length) suggestions.push('add 1-2 portfolio links');
      if (!profile.githubUrl) suggestions.push('add your GitHub profile link');
      if (!profile.linkedinUrl) suggestions.push('add your LinkedIn profile link');

      answer = suggestions.length
        ? `Your current profile completion is ${completeness}%. To improve recommendation quality, ${suggestions.join(', ')}.`
        : 'Your profile is already strong. Keep your skills and portfolio updated to maintain recommendation quality.';
    }

    if (action === 'best_roles') {
      const bestRoles = inferBestRoles(rankedProjects.slice(0, 10));
      answer = bestRoles.length
        ? `Based on your profile and current matching projects, the most suitable directions are: ${bestRoles.join(', ')}.`
        : 'I do not have enough data yet to identify your strongest role directions. Add more skills and profile details.';
    }

    if (action === 'why_recommended') {
      if (!selectedProject) {
        return NextResponse.json({ error: 'projectId is required for why_recommended' }, { status: 400 });
      }
      const projectSkills = normalizeList(selectedProject.requiredSkills);
      const matchedSkills = overlap(studentSkills, projectSkills);

      answer =
        'This project is recommended because it aligns with your profile. ' +
        (matchedSkills.length
          ? `Your matching skills include ${matchedSkills.join(', ')}. `
          : 'It is relevant to your interests and recommendation context. ') +
        (profile.city && selectedProject.city
          ? `The location (${selectedProject.city}) is compatible with your city preference. `
          : '') +
        (profile.experienceLevel
          ? `Your current experience level (${profile.experienceLevel}) is considered in match ranking.`
          : '');
    }

    if (action === 'vacancy_analysis') {
      if (!selectedProject) {
        return NextResponse.json({ error: 'projectId is required for vacancy_analysis' }, { status: 400 });
      }

      const projectSkills = normalizeList(selectedProject.requiredSkills);
      const matchedSkills = overlap(studentSkills, projectSkills);
      const missingSkills = projectSkills.filter(
        (skill) => !studentSkills.map((x) => x.toLowerCase()).includes(skill.toLowerCase())
      );

      answer =
        `This vacancy appears ${matchedSkills.length >= 2 ? 'well aligned' : 'partially aligned'} with your current profile. ` +
        (matchedSkills.length ? `You already match: ${matchedSkills.join(', ')}. ` : '') +
        (missingSkills.length
          ? `To improve your application, strengthen: ${missingSkills.slice(0, 3).join(', ')}. `
          : '') +
        `Category fit: ${selectedProject.category || 'General'}.`;
    }

    if (action === 'cover_letter') {
      if (!selectedProject) {
        return NextResponse.json({ error: 'projectId is required for cover_letter' }, { status: 400 });
      }

      const projectSkills = normalizeList(selectedProject.requiredSkills);
      const matchedSkills = overlap(studentSkills, projectSkills);

      answer = `Hello, I am interested in your project "${selectedProject.title}". My background includes ${studentSkills
        .slice(0, 5)
        .join(', ')}. ${
        matchedSkills.length
          ? `I am a strong fit because my skills match your requirements, including ${matchedSkills.join(', ')}.`
          : 'I am ready to contribute and quickly adapt to your project requirements.'
      } I would be glad to discuss project details and timeline.`;
    }

    return NextResponse.json({ answer, profileCompleteness: completeness, action });
  } catch (error) {
    console.error('Assistant route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
