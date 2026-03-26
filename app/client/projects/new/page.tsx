'use client';
import { useState } from 'react';

export default function NewProjectPage() {
  const [msg, setMsg] = useState('');
  async function submit(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setMsg(res.ok ? 'Project created.' : 'Failed to create project.');
  }
  return <form action={submit} className="card p-6 space-y-3 max-w-3xl"><h1 className="text-2xl font-bold">Create Project</h1><input name="title" className="border p-2 rounded w-full" placeholder="Project title" /><textarea name="description" className="border p-2 rounded w-full" placeholder="Project description" /><input name="category" className="border p-2 rounded w-full" placeholder="Category" /><input name="requiredSkills" className="border p-2 rounded w-full" placeholder="Required skills (comma separated)" /><div className="grid grid-cols-2 gap-3"><input name="budgetMin" type="number" className="border p-2 rounded" placeholder="Budget min" /><input name="budgetMax" type="number" className="border p-2 rounded" placeholder="Budget max" /></div><button className="px-4 py-2 bg-brand text-white rounded">Publish project</button>{msg && <p>{msg}</p>}</form>;
}
