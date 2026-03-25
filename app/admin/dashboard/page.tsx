import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  const [users, students, clients, projects, applications] = await Promise.all([
    prisma.user.count(), prisma.user.count({ where: { role: 'STUDENT' } }), prisma.user.count({ where: { role: 'CLIENT' } }), prisma.project.count(), prisma.application.count()
  ]);
  return <div><h1 className="text-3xl font-bold">Admin Dashboard</h1><div className="mt-4 grid gap-3 md:grid-cols-5">{[['Total users',users],['Total students',students],['Total clients',clients],['Total projects',projects],['Total applications',applications]].map(([k,v])=><div key={String(k)} className="card"><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-semibold">{String(v)}</p></div>)}</div></div>;
}
