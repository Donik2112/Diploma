'use client';
import { useEffect, useState } from 'react';

export default function StudentProfilePage() {
  const [form, setForm] = useState<any>({ university: '', city: '', bio: '', about: '', skills: '', interests: '', certificates: '', portfolioLinks: '', githubUrl: '', linkedinUrl: '', experienceLevel: 'JUNIOR', availabilityStatus: 'AVAILABLE' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/student/profile').then((r) => r.json()).then((payload) => {
      const p = payload.data;
      if (!p) return;
      setForm((s: any) => ({ ...s, ...p, skills: (p.skills || []).join(', '), interests: (p.interests || []).join(', '), certificates: (p.certificates || []).join(', '), portfolioLinks: (p.portfolioLinks || []).join(', ') }));
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const payload = {
      ...form,
      skills: String(form.skills).split(',').map((s: string) => s.trim()).filter(Boolean),
      interests: String(form.interests).split(',').map((s: string) => s.trim()).filter(Boolean),
      certificates: String(form.certificates).split(',').map((s: string) => s.trim()).filter(Boolean),
      portfolioLinks: String(form.portfolioLinks).split(',').map((s: string) => s.trim()).filter(Boolean)
    };
    const res = await fetch('/api/student/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? 'Profile updated successfully.' : data?.error?.message || 'Failed to save profile.');
  }

  return <form onSubmit={submit} className="card p-6 space-y-3 max-w-3xl"><h1 className="text-2xl font-bold">Edit Student Profile</h1><input value={form.university || ''} onChange={(e)=>setForm({ ...form, university: e.target.value })} className="border p-2 rounded w-full" placeholder="University" /><input value={form.city || ''} onChange={(e)=>setForm({ ...form, city: e.target.value })} className="border p-2 rounded w-full" placeholder="City" /><textarea value={form.bio || ''} onChange={(e)=>setForm({ ...form, bio: e.target.value })} className="border p-2 rounded w-full" placeholder="Short bio" /><textarea value={form.about || ''} onChange={(e)=>setForm({ ...form, about: e.target.value })} className="border p-2 rounded w-full" placeholder="About" /><input value={form.skills || ''} onChange={(e)=>setForm({ ...form, skills: e.target.value })} className="border p-2 rounded w-full" placeholder="Skills (comma separated)" /><input value={form.interests || ''} onChange={(e)=>setForm({ ...form, interests: e.target.value })} className="border p-2 rounded w-full" placeholder="Interests (comma separated)" /><input value={form.certificates || ''} onChange={(e)=>setForm({ ...form, certificates: e.target.value })} className="border p-2 rounded w-full" placeholder="Certificates (comma separated)" /><input value={form.portfolioLinks || ''} onChange={(e)=>setForm({ ...form, portfolioLinks: e.target.value })} className="border p-2 rounded w-full" placeholder="Portfolio links (comma separated)" /><input value={form.githubUrl || ''} onChange={(e)=>setForm({ ...form, githubUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="GitHub URL" /><input value={form.linkedinUrl || ''} onChange={(e)=>setForm({ ...form, linkedinUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="LinkedIn URL" /><button className="px-4 py-2 bg-brand text-white rounded">Save profile</button>{message && <p className="text-sm">{message}</p>}</form>;
}
