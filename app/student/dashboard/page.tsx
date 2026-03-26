import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  const apps = await prisma.application.findMany({ where: { studentId: user.id }, include: { project: true }, take: 5, orderBy: { createdAt: 'desc' } });
  const accepted = apps.filter((a) => a.status === 'ACCEPTED').length;
  const recCount = await prisma.recommendationLog.count({ where: { studentId: user.id } });
  const completion = user.studentProfile ? 85 : 40;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Welcome, {user.fullName}</h1>
      <div className="grid gap-3 md:grid-cols-4">{[
        ['Applications sent', String(apps.length)],
        ['Accepted applications', String(accepted)],
        ['Average match score', recCount ? '72%' : 'No data'],
        ['Profile completion', `${completion}%`]
      ].map(([k,v]) => <div key={k} className="card"><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-semibold">{v}</p></div>)}</div>
      <div className="card"><p className="font-semibold">Recommended Projects</p><Link href="/student/recommendations" className="text-brand-600">Open ranked recommendations</Link></div>
      <div className="card"><p className="font-semibold">Recent Applications</p>{apps.map((a) => <p key={a.id} className="text-sm">{a.project.title} - {a.status}</p>)}</div>
    </div>
  );
}
