'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TagAutocompleteInput from '@/components/forms/TagAutocompleteInput';
import { EMPLOYMENT_FORMAT_SUGGESTIONS, INTEREST_SUGGESTIONS, PREFERRED_ROLE_SUGGESTIONS, SKILL_SUGGESTIONS } from '@/lib/profileSuggestions';

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>({
    city: '',
    university: '',
    experienceLevel: 'JUNIOR',
    availabilityStatus: 'AVAILABLE',
    skills: [],
    interests: [],
    about: '',
    portfolioLinks: [],
    githubUrl: '',
    linkedinUrl: '',
    certificates: [],
    preferredEmploymentTypes: [],
    preferredRoles: [],
    onboardingCompleted: true
  });
  const [message, setMessage] = useState('');

  async function finish() {
    setMessage('');
    const res = await fetch('/api/student/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const payload = await res.json();
      setMessage(payload?.error?.message || payload?.error || 'Could not save onboarding');
      return;
    }
    router.push('/student/dashboard');
  }

  return (
    <div className="card p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Complete your profile</h1>
      <p className="text-slate-600">Answer a few quick questions to get better recommendations.</p>
      <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="border p-2 rounded w-full" placeholder="University" />
      <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border p-2 rounded w-full" placeholder="City" />
      <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="border p-2 rounded w-full">
        <option value="JUNIOR">Junior</option><option value="MIDDLE">Middle</option><option value="SENIOR">Senior</option>
      </select>
      <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="border p-2 rounded w-full">
        <option value="AVAILABLE">Available</option><option value="PART_TIME">Part-time</option><option value="BUSY">Busy</option>
      </select>
      <TagAutocompleteInput label="Skills" values={form.skills} suggestions={SKILL_SUGGESTIONS} onChange={(skills) => setForm({ ...form, skills })} />
      <TagAutocompleteInput label="Interests" values={form.interests} suggestions={INTEREST_SUGGESTIONS} onChange={(interests) => setForm({ ...form, interests })} />
      <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="border p-2 rounded w-full" placeholder="Short professional summary" />
      <input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="GitHub URL" />
      <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="border p-2 rounded w-full" placeholder="LinkedIn URL" />
      <input value={(form.portfolioLinks || []).join(', ')} onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} className="border p-2 rounded w-full" placeholder="Portfolio links (comma separated)" />
      <input value={(form.certificates || []).join(', ')} onChange={(e) => setForm({ ...form, certificates: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} className="border p-2 rounded w-full" placeholder="Certificates (comma separated, optional)" />
      <TagAutocompleteInput label="Preferred roles" values={form.preferredRoles} suggestions={PREFERRED_ROLE_SUGGESTIONS} onChange={(preferredRoles) => setForm({ ...form, preferredRoles })} />
      <TagAutocompleteInput label="Preferred employment format" values={form.preferredEmploymentTypes} suggestions={EMPLOYMENT_FORMAT_SUGGESTIONS} onChange={(preferredEmploymentTypes) => setForm({ ...form, preferredEmploymentTypes })} />
      <div className="flex gap-2">
        <button type="button" onClick={finish} className="px-4 py-2 bg-brand text-white rounded">Finish onboarding</button>
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
