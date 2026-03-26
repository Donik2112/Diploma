import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ClientProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const projects = await prisma.project.findMany({ where: { clientId: user.id }, include: { applications: true }, orderBy: { createdAt: 'desc' } });
  return <div><h1 className="text-3xl font-bold">Manage Projects</h1><div className="mt-4 space-y-3">{projects.map((p) => <div className="card" key={p.id}><p className="font-semibold">{p.title}</p><p className="text-sm">Status: {p.status} • Applications: {p.applications.length}</p><Link className="text-brand-600" href={`/client/projects/${p.id}/applicants`}>View applicants</Link></div>)}</div></div>;
}
