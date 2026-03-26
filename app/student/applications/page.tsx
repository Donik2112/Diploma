import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function StudentApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const apps = await prisma.application.findMany({ where: { studentId: user.id }, include: { project: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-3xl font-bold">My Applications</h1>
      <div className="mt-4 space-y-3">{apps.map((a) => <div key={a.id} className="card"><p className="font-semibold">{a.project.title}</p><p className="text-sm">Status: {a.status} • Proposed price: ${a.proposedPrice} • Duration: {a.estimatedDuration}</p></div>)}</div>
    </div>
  );
}
