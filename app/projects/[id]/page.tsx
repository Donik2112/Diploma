import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ProjectDetails({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id }, include: { client: { include: { clientProfile: true } } } });
  if (!project) return notFound();
  const similar = await prisma.project.findMany({ where: { category: project.category, id: { not: project.id }, status: 'OPEN' }, take: 3 });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-3 text-slate-700">{project.description}</p>
      <div className="mt-4 grid gap-2 rounded-xl border bg-white p-4 text-sm md:grid-cols-2">
        <p><b>Category:</b> {project.category}</p>
        <p><b>Required skills:</b> {project.requiredSkills.join(', ')}</p>
        <p><b>Budget:</b> ${project.budgetMin} - ${project.budgetMax}</p>
        <p><b>Deadline:</b> {project.deadline.toDateString()}</p>
        <p><b>Client:</b> {project.client.clientProfile?.companyName ?? project.client.fullName}</p>
      </div>
      <Link href="/signin" className="mt-4 inline-block rounded bg-brand-600 px-4 py-2 text-white">Apply as Student</Link>
      <h2 className="mt-8 text-xl font-semibold">Similar Projects</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">{similar.map((s) => <div key={s.id} className="card"><p>{s.title}</p></div>)}</div>
    </main>
  );
}
