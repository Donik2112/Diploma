'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ApplicantsPageClient() {
  const [rows, setRows] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId') ?? '';

  async function load() {
    if (!projectId) return;
    const res = await fetch(`/api/projects/${projectId}/applications`);
    const payload = await res.json();
    setRows(payload.data || []);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function setStatus(id: string, action: 'ACCEPT' | 'REJECT') {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    load();
  }

  return <div className="card p-6"><h1 className="text-2xl font-bold">Applicants</h1>{!projectId && <p className="mt-2 text-slate-600">Open this page with <code>?projectId=...</code>.</p>}<div className="mt-4 space-y-3">{rows.map((r: any) => <div key={r._id} className="border rounded p-3"><p className="font-semibold">Student ID: {r.studentId}</p><p className="text-sm">Proposed price: ${r.proposedPrice} • Estimated duration: {r.estimatedDuration}</p><p className="text-sm">Cover letter: {r.coverLetter}</p><p className="text-sm">Status: {r.status}</p><div className="flex gap-2 mt-2"><button onClick={() => setStatus(r._id, 'ACCEPT')} className="px-2 py-1 border rounded">Accept</button><button onClick={() => setStatus(r._id, 'REJECT')} className="px-2 py-1 border rounded text-red-600">Reject</button></div></div>)}</div></div>;
}
