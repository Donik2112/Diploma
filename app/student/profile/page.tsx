'use client';

import { useEffect, useMemo, useState } from 'react';

export default function StudentProfilePage() {
  const [form, setForm] = useState<any>({
    university: '',
    city: '',
    bio: '',
    about: '',
    skills: '',
    interests: '',
    certificates: '',
    portfolioLinks: '',
    githubUrl: '',
    linkedinUrl: '',
    experienceLevel: 'JUNIOR',
    availabilityStatus: 'AVAILABLE'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/student/profile')
      .then((r) => r.json())
      .then((payload) => {
        const p = payload.data;
        if (!p) return;
        setForm((s: any) => ({
          ...s,
          ...p,
          skills: (p.skills || []).join(', '),
          interests: (p.interests || []).join(', '),
          certificates: (p.certificates || []).join(', '),
          portfolioLinks: (p.portfolioLinks || []).join(', ')
        }));
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
    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setMessage(res.ok ? 'Profile updated successfully.' : data?.error?.message || 'Failed to save profile.');
  }

  const completion = useMemo(() => {
    const checks = [form.university, form.city, form.bio, form.skills, form.portfolioLinks, form.githubUrl, form.linkedinUrl];
    const filled = checks.filter((x) => String(x || '').trim()).length;
    return Math.round((filled / checks.length) * 100);
  }, [form]);

  return (
    <div className="space-y-6 py-2">
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-semibold text-white">
              {String(form.fullName || 'S').slice(0, 1)}
            </div>
            <div>
              <h1 className="section-title">Student profile</h1>
              <p className="muted mt-1">Build trust with a complete profile, portfolio evidence, and clear positioning.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="status-pill bg-emerald-100 text-emerald-700">Verified student</span>
                <span className="status-pill bg-blue-100 text-blue-700">Reputation ready</span>
              </div>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Profile completion</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{completion}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="card space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.university || ''} onChange={(e) => setForm({ ...form, university: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="University" />
          <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="City" />
        </div>

        <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-20 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Short professional bio" />
        <textarea value={form.about || ''} onChange={(e) => setForm({ ...form, about: e.target.value })} className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="About your experience and preferred project types" />

        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.skills || ''} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Skills (comma separated)" />
          <input value={form.interests || ''} onChange={(e) => setForm({ ...form, interests: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Interests (comma separated)" />
          <input value={form.certificates || ''} onChange={(e) => setForm({ ...form, certificates: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Certificates (comma separated)" />
          <input value={form.portfolioLinks || ''} onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Portfolio links (comma separated)" />
          <input value={form.githubUrl || ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="GitHub URL" />
          <input value={form.linkedinUrl || ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="LinkedIn URL" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.experienceLevel || 'JUNIOR'} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
            <option value="JUNIOR">JUNIOR</option>
            <option value="MIDDLE">MIDDLE</option>
            <option value="SENIOR">SENIOR</option>
          </select>
          <select value={form.availabilityStatus || 'AVAILABLE'} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="PARTIALLY_AVAILABLE">PARTIALLY AVAILABLE</option>
            <option value="BUSY">BUSY</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary">Save profile</button>
          <span className="text-sm text-slate-500">Tip: keep skills and portfolio updated to improve recommendation quality.</span>
        </div>
        {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
      </form>
    </div>
  );
}
