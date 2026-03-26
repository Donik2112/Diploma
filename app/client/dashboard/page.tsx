import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ClientDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const projects = await prisma.project.findMany({ where: { clientId: user.id }, include: { applications: true }, orderBy: { createdAt: 'desc' } });
  const active = projects.filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const totalApps = projects.reduce((acc, p) => acc + p.applications.length, 0);
  return (
    <div>
      <h1 className="text-3xl font-bold">Client Dashboard</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-4">{[
        ['Active projects', String(active)],
        ['Received applications', String(totalApps)],
        ['Projects completed', String(completed)],
        ['Average student rating', '4.4']
      ].map(([k,v]) => <div key={k} className="card"><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-semibold">{v}</p></div>)}</div>
      <Link href="/client/new-project" className="mt-5 inline-block rounded bg-brand-600 px-4 py-2 text-white">Create New Project</Link>
    </div>
  );
}
