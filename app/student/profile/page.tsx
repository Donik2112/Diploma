'use client';
import { useState } from 'react';

export default function StudentProfilePage() {
  const [msg, setMsg] = useState('');
  const submit = async (formData: FormData) => {
    const payload = { ...Object.fromEntries(formData.entries()), skills: String(formData.get('skills') || '').split(',').map((s) => s.trim()), interests: String(formData.get('interests') || '').split(',').map((s) => s.trim()) };
    const res = await fetch('/api/student/profile', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    setMsg(res.ok ? 'Profile updated successfully.' : 'Failed to update profile.');
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Student Profile</h1>
      <form action={submit} className="mt-4 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
        <input name="university" placeholder="University" className="rounded border px-3 py-2" />
        <input name="city" placeholder="City" className="rounded border px-3 py-2" />
        <input name="experienceLevel" placeholder="Experience level" className="rounded border px-3 py-2" />
        <input name="availabilityStatus" placeholder="Availability status" className="rounded border px-3 py-2" />
        <input name="skills" placeholder="Skills (comma separated)" className="rounded border px-3 py-2 md:col-span-2" />
        <input name="interests" placeholder="Interests (comma separated)" className="rounded border px-3 py-2 md:col-span-2" />
        <textarea name="bio" placeholder="Bio and about" className="rounded border px-3 py-2 md:col-span-2" />
        <button className="rounded bg-brand-600 px-4 py-2 text-white md:col-span-2">Save Profile</button>
        <p className="text-sm text-slate-600 md:col-span-2">{msg}</p>
      </form>
    </div>
  );
}
