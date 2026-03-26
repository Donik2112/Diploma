'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ q: '', category: '', city: '', experience: '', employment: '', sort: 'newest' });

  async function load() {
    const qs = new URLSearchParams(form as any).toString();
    const res = await fetch(`/api/projects?${qs}`);
    const payload = await res.json();
    setRows(payload.data || []);
  }

  useEffect(() => { load(); }, []);

  return <div className="space-y-4"><div className="card p-4 grid md:grid-cols-6 gap-2"><input value={form.q} onChange={(e)=>setForm({ ...form, q: e.target.value })} placeholder="Keyword" className="border p-2 rounded" /><input value={form.category} onChange={(e)=>setForm({ ...form, category: e.target.value })} placeholder="Category" className="border p-2 rounded" /><input value={form.city} onChange={(e)=>setForm({ ...form, city: e.target.value })} placeholder="City" className="border p-2 rounded" /><input value={form.experience} onChange={(e)=>setForm({ ...form, experience: e.target.value })} placeholder="Experience" className="border p-2 rounded" /><input value={form.employment} onChange={(e)=>setForm({ ...form, employment: e.target.value })} placeholder="Employment" className="border p-2 rounded" /><select value={form.sort} onChange={(e)=>setForm({ ...form, sort: e.target.value })} className="border p-2 rounded"><option value="newest">Newest</option><option value="budget_desc">Budget high to low</option><option value="budget_asc">Budget low to high</option></select><button onClick={load} className="md:col-span-6 px-4 py-2 bg-brand text-white rounded">Apply filters</button></div><div className="grid md:grid-cols-2 gap-4">{rows.map((p: any) => <Link key={p._id} href={`/projects/${p._id}`} className="card p-4"><h3 className="font-semibold">{p.title}</h3><p className="text-sm text-slate-600">{p.category} • {p.city} • {p.experienceLevel}</p><p className="text-sm">${p.budgetMin} - ${p.budgetMax}</p></Link>)}</div>{rows.length === 0 && <div className="card p-6 text-center text-slate-600">No projects found for selected filters.</div>}</div>;
}
