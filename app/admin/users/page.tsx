import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage({ searchParams }: { searchParams: Record<string, string> }) {
  const where: any = {};
  if (searchParams.role) where.role = searchParams.role;
  if (searchParams.q) where.OR = [{ fullName: { contains: searchParams.q, mode: 'insensitive' } }, { email: { contains: searchParams.q, mode: 'insensitive' } }];
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  return <div><h1 className="text-3xl font-bold">Manage Users</h1><form className="mt-4 flex gap-2"><input name="q" placeholder="Search users" className="rounded border px-3 py-2" /><select name="role" className="rounded border px-3 py-2"><option value="">All roles</option><option>STUDENT</option><option>CLIENT</option><option>ADMIN</option></select><button className="rounded bg-brand-600 px-3 text-white">Filter</button></form><div className="mt-4 space-y-2">{users.map((u)=><div key={u.id} className="card"><p className="font-semibold">{u.fullName}</p><p className="text-sm">{u.email} • {u.role} • {u.isSuspended ? 'Suspended' : 'Active'}</p></div>)}</div></div>;
}
