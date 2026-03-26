'use client';
import { useEffect, useState } from 'react';

export default function StudentApplicationsPage() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const res = await fetch('/api/applications');
    const payload = await res.json();
    setRows(payload.data || []);
  }

  useEffect(() => { load(); }, []);

  async function withdraw(id: string) {
    await fetch(`/api/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'WITHDRAW' }) });
    load();
  }

  return <div className="card p-6"><h1 className="text-2xl font-bold mb-3">My Applications</h1><table className="w-full text-sm"><thead><tr className="text-left"><th>Project ID</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>{rows.map((row: any) => <tr key={row._id}><td>{row.projectId}</td><td>{row.status}</td><td>{new Date(row.createdAt).toLocaleDateString()}</td><td>{row.status === 'SENT' ? <button onClick={() => withdraw(row._id)} className="px-2 py-1 border rounded">Withdraw</button> : '-'}</td></tr>)}</tbody></table>{rows.length===0 && <p className="text-slate-600 mt-3">No applications yet.</p>}</div>;
}
