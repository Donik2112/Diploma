import { prisma } from '@/lib/prisma';

export default async function AdminProjectsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const projects = await prisma.project.findMany({ where: searchParams.status ? { status: searchParams.status as any } : {}, orderBy: { createdAt: 'desc' } });
  return <div><h1 className="text-3xl font-bold">Project Moderation</h1><form className="mt-4 flex gap-2"><select name="status" className="rounded border px-3 py-2"><option value="">All statuses</option><option>OPEN</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option></select><button className="rounded bg-brand-600 px-3 text-white">Filter</button></form><div className="mt-4 space-y-2">{projects.map((p)=><div key={p.id} className="card"><p className="font-semibold">{p.title}</p><p className="text-sm">{p.category} • {p.status}</p></div>)}</div></div>;
}
