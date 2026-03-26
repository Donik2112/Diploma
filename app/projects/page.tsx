import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export default async function ProjectsPage({ searchParams }: { searchParams: Record<string, string> }) {
  await connectDB();
  const q = searchParams.q || '';
  const projects = await Project.find({ status: 'OPEN', title: { $regex: q, $options: 'i' } }).sort({ createdAt: -1 }).limit(30).lean();
  return <div className="space-y-4"><div className="card p-4"><form><input name="q" defaultValue={q} placeholder="Search projects" className="border p-2 rounded w-full" /></form></div><div className="grid md:grid-cols-2 gap-4">{projects.map((p: any) => <Link key={p._id.toString()} href={`/projects/${p._id}`} className="card p-4"><h3 className="font-semibold">{p.title}</h3><p className="text-sm text-slate-600">{p.category} • {p.city}</p><p className="text-sm">${p.budgetMin} - ${p.budgetMax}</p></Link>)}</div></div>;
}
