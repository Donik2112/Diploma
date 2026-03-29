'use client';
import { useEffect, useState } from 'react';
import TagAutocompleteInput from '@/components/forms/TagAutocompleteInput';
import { EMPLOYMENT_FORMAT_SUGGESTIONS, INTEREST_SUGGESTIONS, PREFERRED_ROLE_SUGGESTIONS, SKILL_SUGGESTIONS } from '@/lib/profileSuggestions';

const EMPTY_FORM = {
  university: '',
  city: '',
  bio: '',
  about: '',
  skills: [] as string[],
  interests: [] as string[],
  certificates: [] as string[],
  portfolioLinks: [] as string[],
  githubUrl: '',
  linkedinUrl: '',
  experienceLevel: 'JUNIOR',
  availabilityStatus: 'AVAILABLE',
  preferredRoles: [] as string[],
  preferredEmploymentTypes: [] as string[],
  onboardingCompleted: false
};

export default function StudentProfilePage() {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [completeness, setCompleteness] = useState<{ percent: number; missingFields: string[]; nextRecommendedAction: string } | null>(null);

  useEffect(() => {
    fetch('/api/student/profile').then((r) => r.json()).then((payload) => {
      const p = payload?.data;
      if (!p) return;
      setForm((s: any) => ({ ...s, ...p }));
      setCompleteness(p.completeness || null);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const payload = { ...form, onboardingCompleted: true };
    const res = await fetch('/api/student/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? 'Profile updated successfully.' : data?.error?.message || data?.error || 'Failed to save profile.');
  }

  function updateList(key: string, index: number, value: string) {
    const next = [...(form[key] || [])];
    next[index] = value;
    setForm({ ...form, [key]: next });
  }

  function addListItem(key: string) {
    setForm({ ...form, [key]: [...(form[key] || []), ''] });
  }

  function removeListItem(key: string, index: number) {
    setForm({ ...form, [key]: (form[key] || []).filter((_: string, i: number) => i !== index) });
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Edit Student Profile</h1>

      {completeness && (
        <div className="border rounded p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profile completeness</span>
            <span>{completeness.percent}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded">
            <div className="h-2 bg-brand rounded" style={{ width: `${completeness.percent}%` }} />
          </div>
          {completeness.missingFields.length > 0 && (
            <ul className="text-sm text-slate-600 list-disc ml-6">
              {completeness.missingFields.slice(0, 4).map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
          <p className="text-sm text-slate-600">Complete your profile to improve recommendations.</p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Basic info</h2>
        <input value={form.university || ''} onChange={(e) => setForm({ ...form, university: e.target.value })} className="border p-2 rounded w-full" placeholder="University" />
        <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border p-2 rounded w-full" placeholder="City" />
        <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="border p-2 rounded w-full" placeholder="Short professional summary" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Skills</h2>
        <TagAutocompleteInput label="Skills" values={form.skills || []} suggestions={SKILL_SUGGESTIONS} onChange={(skills) => setForm({ ...form, skills })} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Interests</h2>
        <TagAutocompleteInput label="Interests" values={form.interests || []} suggestions={INTEREST_SUGGESTIONS} onChange={(interests) => setForm({ ...form, interests })} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Availability / Experience</h2>
        <select value={form.experienceLevel || 'JUNIOR'} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="border p-2 rounded w-full">
          <option value="JUNIOR">Junior</option><option value="MIDDLE">Middle</option><option value="SENIOR">Senior</option>
        </select>
        <select value={form.availabilityStatus || 'AVAILABLE'} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="border p-2 rounded w-full">
          <option value="AVAILABLE">Available</option><option value="PART_TIME">Part-time</option><option value="BUSY">Busy</option>
        </select>
        <TagAutocompleteInput label="Preferred roles" values={form.preferredRoles || []} suggestions={PREFERRED_ROLE_SUGGESTIONS} onChange={(preferredRoles) => setForm({ ...form, preferredRoles })} />
        <TagAutocompleteInput label="Preferred employment format" values={form.preferredEmploymentTypes || []} suggestions={EMPLOYMENT_FORMAT_SUGGESTIONS} onChange={(preferredEmploymentTypes) => setForm({ ...form, preferredEmploymentTypes })} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Links</h2>
        <input value={form.githubUrl || ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="GitHub URL" />
        <input value={form.linkedinUrl || ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="LinkedIn URL" />
        <div className="space-y-2">
          {(form.portfolioLinks || []).map((link: string, i: number) => (
            <div key={`${link}-${i}`} className="flex gap-2">
              <input value={link} onChange={(e) => updateList('portfolioLinks', i, e.target.value)} className="border p-2 rounded w-full" placeholder="Portfolio link" />
              <button type="button" onClick={() => removeListItem('portfolioLinks', i)} className="px-2 border rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem('portfolioLinks')} className="px-3 py-1 border rounded text-sm">Add portfolio link</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Certificates</h2>
        <div className="space-y-2">
          {(form.certificates || []).map((item: string, i: number) => (
            <div key={`${item}-${i}`} className="flex gap-2">
              <input value={item} onChange={(e) => updateList('certificates', i, e.target.value)} className="border p-2 rounded w-full" placeholder="Certificate" />
              <button type="button" onClick={() => removeListItem('certificates', i)} className="px-2 border rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem('certificates')} className="px-3 py-1 border rounded text-sm">Add certificate</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">About</h2>
        <textarea value={form.about || ''} onChange={(e) => setForm({ ...form, about: e.target.value })} className="border p-2 rounded w-full" placeholder="About your professional direction" />
      </section>

      <button className="px-4 py-2 bg-brand text-white rounded">Save profile</button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
