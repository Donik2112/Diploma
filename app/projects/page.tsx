import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function ProjectsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const where: any = { status: 'OPEN' };
  if (searchParams.q) where.OR = [{ title: { contains: searchParams.q, mode: 'insensitive' } }, { description: { contains: searchParams.q, mode: 'insensitive' } }];
  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.city) where.city = searchParams.city;
  if (searchParams.experience) where.experienceLevel = searchParams.experience;
  if (searchParams.employment) where.employmentType = searchParams.employment;

  const projects = await prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, take: 30 });
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold">Open Projects Catalog</h1>
      <form className="mt-4 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-6">
        <input name="q" placeholder="Search keyword" className="rounded border px-2 py-1" />
        <input name="category" placeholder="Category" className="rounded border px-2 py-1" />
        <input name="city" placeholder="City" className="rounded border px-2 py-1" />
        <input name="experience" placeholder="Experience" className="rounded border px-2 py-1" />
        <input name="employment" placeholder="Employment type" className="rounded border px-2 py-1" />
        <button className="rounded bg-brand-600 px-3 py-1 text-white">Apply Filters</button>
      </form>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div className="card" key={p.id}>
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{p.description}</p>
            <p className="mt-2 text-sm">{p.city} • {p.employmentType} • {p.experienceLevel}</p>
            <p className="text-sm">Budget: ${p.budgetMin} - ${p.budgetMax}</p>
            <Link className="mt-3 inline-block text-brand-600" href={`/projects/${p.id}`}>View details</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
