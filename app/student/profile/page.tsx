'use client';

import { useEffect, useMemo, useState } from 'react';

type ProfileData = {
  fullName?: string;
  university: string;
  city: string;
  bio: string;
  about: string;
  skills: string[];
  interests: string[];
  certificates: string[];
  portfolioLinks: string[];
  githubUrl: string;
  linkedinUrl: string;
  experienceLevel: string;
  availabilityStatus: string;
  completion: number;
};

const emptyProfile: ProfileData = {
  fullName: '',
  university: '',
  city: '',
  bio: '',
  about: '',
  skills: [],
  interests: [],
  certificates: [],
  portfolioLinks: [],
  githubUrl: '',
  linkedinUrl: '',
  experienceLevel: 'JUNIOR',
  availabilityStatus: 'AVAILABLE',
  completion: 0
};

function toCsv(arr: string[]) {
  return arr.join(', ');
}

function fromCsv(value: string) {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function computeCompletionLocal(profile: ProfileData) {
  const checks = [
    profile.university,
    profile.city,
    profile.bio,
    profile.about,
    profile.skills.length ? 'ok' : '',
    profile.interests.length ? 'ok' : '',
    profile.certificates.length ? 'ok' : '',
    profile.portfolioLinks.length ? 'ok' : '',
    profile.githubUrl,
    profile.linkedinUrl,
    profile.experienceLevel,
    profile.availabilityStatus
  ];
  const filled = checks.filter((x) => String(x || '').trim()).length;
  return Math.round((filled / checks.length) * 100);
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [editMode, setEditMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/student/profile');
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message || payload?.error || 'Could not load profile');
        }
        const data = payload.data as ProfileData;
        setProfile(data);
        setForm({
          university: data.university || '',
          city: data.city || '',
          bio: data.bio || '',
          about: data.about || '',
          skills: toCsv(data.skills || []),
          interests: toCsv(data.interests || []),
          certificates: toCsv(data.certificates || []),
          portfolioLinks: toCsv(data.portfolioLinks || []),
          githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          experienceLevel: data.experienceLevel || 'JUNIOR',
          availabilityStatus: data.availabilityStatus || 'AVAILABLE'
        });
        setEditMode(false);
      } catch (err: any) {
        setError(err?.message || 'Could not load profile');
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const localPreview = useMemo<ProfileData>(() => ({
    ...profile,
    ...form,
    skills: fromCsv(form.skills),
    interests: fromCsv(form.interests),
    certificates: fromCsv(form.certificates),
    portfolioLinks: fromCsv(form.portfolioLinks),
    completion: computeCompletionLocal({
      ...profile,
      ...form,
      skills: fromCsv(form.skills),
      interests: fromCsv(form.interests),
      certificates: fromCsv(form.certificates),
      portfolioLinks: fromCsv(form.portfolioLinks),
      completion: 0
    })
  }), [form, profile]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          skills: fromCsv(form.skills),
          interests: fromCsv(form.interests),
          certificates: fromCsv(form.certificates),
          portfolioLinks: fromCsv(form.portfolioLinks)
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Failed to save profile');
      }
      const data = payload.data as ProfileData;
      setProfile(data);
      setMessage('Profile saved successfully.');
      setEditMode(false);
    } catch (err: any) {
      console.error('PROFILE SAVE CLIENT ERROR:', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card p-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 py-2">
      {(error || message) && (
        <div className={`card p-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      {!editMode ? (
        <>
          <section className="card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-semibold text-white">
                  {String(profile.fullName || 'S').slice(0, 1)}
                </div>
                <div>
                  <h1 className="section-title">{profile.fullName || 'Student profile'}</h1>
                  <p className="muted mt-1">{profile.university || 'University not specified'} · {profile.city || 'City not specified'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="status-pill bg-emerald-100 text-emerald-700">Verified student</span>
                    <span className="status-pill bg-blue-100 text-blue-700">{profile.experienceLevel || 'JUNIOR'}</span>
                    <span className="status-pill bg-slate-100 text-slate-700">{profile.availabilityStatus || 'AVAILABLE'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEditMode(true)} className="btn-secondary">Edit profile</button>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                <p className="mt-2 text-sm text-slate-600">{profile.about || profile.bio || 'No summary yet. Add a strong profile summary in edit mode.'}</p>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.skills || []).length ? profile.skills.map((item) => <span key={item} className="pill">{item}</span>) : <p className="text-sm text-slate-500">No skills added yet.</p>}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900">Interests</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.interests || []).length ? profile.interests.map((item) => <span key={item} className="pill">{item}</span>) : <p className="text-sm text-slate-500">No interests added yet.</p>}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900">Portfolio and Certificates</h2>
                <div className="mt-3 space-y-2">
                  {(profile.portfolioLinks || []).length ? profile.portfolioLinks.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noreferrer" className="block text-sm font-medium text-blue-700 underline">{link}</a>
                  )) : <p className="text-sm text-slate-500">No portfolio links yet.</p>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(profile.certificates || []).length ? profile.certificates.map((item) => <span key={item} className="pill">{item}</span>) : <p className="text-sm text-slate-500">No certificates added yet.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900">Profile completeness</h3>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{profile.completion}%</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${profile.completion}%` }} />
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900">Professional links</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {profile.githubUrl ? <a className="block text-blue-700 underline" href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : <p className="text-slate-500">GitHub not set</p>}
                  {profile.linkedinUrl ? <a className="block text-blue-700 underline" href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : <p className="text-slate-500">LinkedIn not set</p>}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <form onSubmit={submit} className="card space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="section-title">Edit profile</h1>
            <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">View profile</button>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Basic information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="University" />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="City" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="min-h-20 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Short professional bio" />
            <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Detailed profile summary" />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Skills and interests</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Skills (comma separated)" />
              <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Interests (comma separated)" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Portfolio and links</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.portfolioLinks} onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Portfolio links (comma separated)" />
              <input value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Certificates (comma separated)" />
              <input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="GitHub URL (optional)" />
              <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="LinkedIn URL (optional)" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Career preferences</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="JUNIOR">JUNIOR</option>
                <option value="MIDDLE">MIDDLE</option>
                <option value="SENIOR">SENIOR</option>
              </select>
              <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="PARTIALLY_AVAILABLE">PARTIALLY_AVAILABLE</option>
                <option value="BUSY">BUSY</option>
              </select>
            </div>
            <p className="text-sm text-slate-500">Current completion preview: {localPreview.completion}%</p>
          </section>

          <button disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      )}
    </div>
  );
}
