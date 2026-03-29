'use client';

import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/admin/students');
    const payload = await res.json();
    setRows(payload?.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(userId: string, action: 'APPROVE' | 'REJECT') {
    const rejectionReason = action === 'REJECT' ? (prompt('Optional rejection reason:') || '') : '';
    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, rejectionReason })
    });
    const payload = await res.json();
    setMessage(res.ok ? 'Status updated.' : payload?.error || 'Failed to update status');
    load();
  }

  return (
    <div className="card p-6 space-y-4">
      <h1 className="text-2xl font-bold">Pending student approvals</h1>
      {message && <p className="text-sm">{message}</p>}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row._id} className="border rounded p-3">
            <p className="font-semibold">{row.fullName}</p>
            <p className="text-sm text-slate-600">{row.email}</p>
            <p className="text-sm">University: {row.university || 'Not set'}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => decide(row._id, 'APPROVE')} className="px-3 py-1 border rounded">Approve</button>
              <button onClick={() => decide(row._id, 'REJECT')} className="px-3 py-1 border rounded text-red-600">Reject</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-600">No pending students.</p>}
      </div>
    </div>
  );
}
