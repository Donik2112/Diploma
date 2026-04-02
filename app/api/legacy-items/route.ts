import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Vacancy from '@/models/Vacancy';
import ImportedProject from '@/models/ImportedProject';
import { mapProjectToLegacyCard, mapVacancyToLegacyCard } from '@/lib/adapters/legacy-items';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const [vacanciesRaw, projectsRaw] = await Promise.all([
      Vacancy.find({}).lean(),
      ImportedProject.find({}).lean(),
    ]);

    const vacancies = Array.isArray(vacanciesRaw) ? vacanciesRaw : [];
    const projects = Array.isArray(projectsRaw) ? projectsRaw : [];

    const items = [
      ...vacancies.map((vacancy) => mapVacancyToLegacyCard(vacancy as Record<string, any>)),
      ...projects.map((project) => mapProjectToLegacyCard(project as Record<string, any>)),
    ];

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to load normalized legacy items.',
      },
      { status: 500 }
    );
  }
}
