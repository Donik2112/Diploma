'use client';
import { useState } from 'react';

export default function NewProjectPage() {
  const [msg, setMsg] = useState('');
  const submit = async (formData: FormData) => {
    const payload = { ...Object.fromEntries(formData.entries()), requiredSkills: String(formData.get('requiredSkills') || '').split(',').map((s) => s.trim()), budgetMin: Number(formData.get('budgetMin')), budgetMax: Number(formData.get('budgetMax')) };
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setMsg(res.ok ? 'Project created successfully.' : 'Failed to create project.');
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">Create Project</h1>
      <form action={submit} className="mt-4 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
        <input required name="title" placeholder="Project title" className="rounded border px-3 py-2 md:col-span-2" />
        <textarea required name="description" placeholder="Project description" className="rounded border px-3 py-2 md:col-span-2" />
        <input name="category" placeholder="Category" className="rounded border px-3 py-2" />
        <input name="requiredSkills" placeholder="Required skills (comma separated)" className="rounded border px-3 py-2" />
        <input name="budgetMin" type="number" placeholder="Budget min" className="rounded border px-3 py-2" />
        <input name="budgetMax" type="number" placeholder="Budget max" className="rounded border px-3 py-2" />
        <input name="deadline" type="date" className="rounded border px-3 py-2" />
        <input name="city" placeholder="City" className="rounded border px-3 py-2" />
        <input name="employmentType" placeholder="Employment type" className="rounded border px-3 py-2" />
        <input name="experienceLevel" placeholder="Experience level" className="rounded border px-3 py-2" />
        <button className="rounded bg-brand-600 px-4 py-2 text-white md:col-span-2">Publish Project</button>
        <p className="text-sm text-slate-600 md:col-span-2">{msg}</p>
      </form>
    </div>
  );
}
