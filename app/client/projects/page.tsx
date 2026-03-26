'use client';
import { useEffect, useState } from 'react';

export default function ClientProjectsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    const qs = new URLSearchParams({ q: query }).toString();
    const res = await fetch(`/api/projects?${qs}`);
    const payload = await res.json();
    let data = payload.data || [];
    if (status) data = data.filter((x: any) => x.status === status);
    setRows(data);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, nextStatus: string) {
    await fetch(`/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    load();
  }

  return <div className="space-y-3"><h1 className="text-2xl font-bold">Manage Projects</h1><div className="card p-4 grid md:grid-cols-3 gap-2"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by keyword" className="border p-2 rounded" /><select value={status} onChange={(e)=>setStatus(e.target.value)} className="border p-2 rounded"><option value="">All statuses</option><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></select><button onClick={load} className="bg-brand text-white rounded px-4 py-2">Apply</button></div><div className="space-y-2">{rows.map((r:any)=><div key={r._id} className="card p-4"><div className="flex justify-between gap-3 items-center"><div><p className="font-semibold">{r.title}</p><p className="text-sm text-slate-600">{r.status} • ${r.budgetMin}-${r.budgetMax}</p></div><div className="flex gap-2"><select defaultValue={r.status} onChange={(e)=>updateStatus(r._id, e.target.value)} className="border p-1 rounded"><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></select><button onClick={()=>remove(r._id)} className="px-3 py-1 rounded border text-red-600">Delete</button></div></div></div>)}</div></div>;
}
