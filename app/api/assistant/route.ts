import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { getUserFromCookie } from '@/lib/auth';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import Project from '@/models/Project';
import { calculateProfileCompleteness } from '@/lib/profileReadiness';

export const dynamic = 'force-dynamic';

type AssistantAction =
  | 'why_recommended'
  | 'profile_improvement'
  | 'best_roles'
  | 'vacancy_analysis'
  | 'cover_letter';

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

function rankedCategories(projects: any[]) {
  const count: Record<string, number> = {};
  projects.forEach((p) => {
    const key = String(p?.category || 'General');
    count[key] = (count[key] || 0) + 1;
  });

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

function requireProjectForAction(action: AssistantAction) {
  return action === 'why_recommended' || action === 'vacancy_analysis' || action === 'cover_letter';
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

    const { action, projectId } = parsed.data;

    if (!profile) {
      return NextResponse.json({
        answer:
          'Your profile is incomplete. Add skills, interests, city, and experience level first so I can provide recommendation-aware guidance.',
        profileCompleteness: 0,
        action,
      });
    }

    if (requireProjectForAction(action) && !projectId) {
      return NextResponse.json({ error: `projectId is required for ${action}` }, { status: 400 });
    }

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
      .limit(40)
      .lean();

    const rankedProjects = topProjects
      .map((project) => ({ project, score: recommendationScore(profile, project) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.project);

    let selectedProject: any = null;
    if (projectId) {
      const selectedRaw = await Project.findById(projectId).lean();
      selectedProject = Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw;
      if (!selectedProject && requireProjectForAction(action)) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    let answer = '';

    if (action === 'profile_improvement') {
      const suggestions: string[] = [];
      const weakAreas: string[] = [];

      if (!profile.bio || String(profile.bio).trim().length < 60) {
        weakAreas.push('short bio');
        suggestions.push('write a 2-3 sentence bio focused on your strongest stack and target role');
      }
      if (!profile.about || String(profile.about).trim().length < 180) {
        weakAreas.push('about section');
        suggestions.push('expand the “About” section with concrete project outcomes and responsibilities');
      }
      if (studentSkills.length < 6) {
        weakAreas.push('skills depth');
        suggestions.push('add 4-6 role-specific skills (for example SQL, Power BI, dashboarding, API integration, testing)');
      }
      if (!studentInterests.length) {
        weakAreas.push('interests');
        suggestions.push('add interests so recommendation ranking can better prioritize role families');
      }
      if (!normalizeList(profile.portfolioLinks).length) {
        weakAreas.push('portfolio evidence');
        suggestions.push('add at least 2 portfolio links with short descriptions of your contribution');
      }
      if (!profile.githubUrl) suggestions.push('add a GitHub link with pinned repositories relevant to your target role');
      if (!profile.linkedinUrl) suggestions.push('add a LinkedIn link with updated headline and experience summary');
      if (!profile.experienceLevel) suggestions.push('set your experience level to improve fit filtering for matching projects');
      if (!profile.city) suggestions.push('set city or remote preference to improve location-aware ranking');

      if (!suggestions.length) {
        suggestions.push('refresh your top 5 skills every month based on target vacancies');
        suggestions.push('attach one new portfolio case with measurable impact (time saved, accuracy improved, etc.)');
        suggestions.push('tailor your profile headline to the main role direction you want this semester');
      }

      answer = `Profile completeness: ${completeness}%. ${
        weakAreas.length
          ? `Main weak sections: ${weakAreas.join(', ')}. `
          : 'Your profile is complete, so focus on optimization. '
      }Priority improvements: ${suggestions.slice(0, 4).join('; ')}.`;
    }

    if (action === 'best_roles') {
      const top = rankedCategories(rankedProjects.slice(0, 15));
      const topSkills = studentSkills.slice(0, 6);

      if (!top.length) {
        answer =
          'I do not have enough project pattern data to rank your best-fit role directions yet. Add skills and refresh recommendations.';
      } else {
        const roleText = top
          .map(([role, count], idx) => `${idx + 1}) ${role} (${count} matching projects)`)
          .join('; ');
        answer =
          `Best-fit role directions: ${roleText}. ` +
          `Why this fit: these categories appear most often among projects that match your current profile signals (skills, city, and experience level). ` +
          (topSkills.length ? `Your strongest profile signals now: ${topSkills.join(', ')}.` : 'Add more explicit skills to improve role precision.');
      }
    }

    if (action === 'why_recommended') {
      if (!selectedProject) {
        return NextResponse.json({ error: 'projectId is required for why_recommended' }, { status: 400 });
      }
      const projectSkills = normalizeList(selectedProject.requiredSkills);
      const matchedSkills = overlap(studentSkills, projectSkills);

      answer =
        `Recommendation explanation for "${selectedProject.title}": ` +
        (matchedSkills.length
          ? `skill overlap found (${matchedSkills.join(', ')}). `
          : 'no direct skill overlap found, but the project still aligns with broader profile signals. ') +
        (profile.city && selectedProject.city
          ? `Location alignment: your city preference and project city (${selectedProject.city}) are compatible. `
          : 'Location signal is neutral. ') +
        (profile.experienceLevel && selectedProject.experienceLevel
          ? `Experience alignment: profile ${profile.experienceLevel} vs project ${selectedProject.experienceLevel}.`
          : 'Experience alignment is estimated from available profile/project data.');
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

      const fitLevel = matchedSkills.length >= 4 ? 'High' : matchedSkills.length >= 2 ? 'Medium' : 'Low';
      const finalRecommendation =
        fitLevel === 'High'
          ? 'Apply now. You already meet the core requirements.'
          : fitLevel === 'Medium'
            ? 'Apply with a focused cover letter and highlight related portfolio evidence.'
            : 'Consider applying only after improving the missing core skills.';

      answer =
        `Vacancy analysis for "${selectedProject.title}": ` +
        `1) Fit level: ${fitLevel}. ` +
        `2) Matched skills: ${matchedSkills.length ? matchedSkills.join(', ') : 'none explicitly matched'}. ` +
        `3) Missing skills: ${missingSkills.length ? missingSkills.slice(0, 5).join(', ') : 'no critical gaps identified'}. ` +
        `4) Recommendation: ${finalRecommendation}`;
    }

    if (action === 'cover_letter') {
      if (!selectedProject) {
        return NextResponse.json({ error: 'projectId is required for cover_letter' }, { status: 400 });
      }

      const projectSkills = normalizeList(selectedProject.requiredSkills);
      const matchedSkills = overlap(studentSkills, projectSkills);
      const introSkills = studentSkills.slice(0, 4).join(', ') || 'relevant technical skills';

      answer =
        `Hello, I am interested in the project "${selectedProject.title}". ` +
        `My background includes ${introSkills}, and I have practical experience with student and freelance-style delivery. ` +
        (matchedSkills.length
          ? `My profile aligns with your requirements, especially ${matchedSkills.slice(0, 3).join(', ')}. `
          : 'I can quickly adapt to your stack and project workflow. ') +
        `I can provide clear communication, structured milestones, and timely delivery. I would be glad to discuss scope and timeline.`;
    }

    return NextResponse.json({ answer, profileCompleteness: completeness, action });
  } catch (error) {
    console.error('Assistant route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
