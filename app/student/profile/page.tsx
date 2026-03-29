'use client';

import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

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
  updatedAt?: string;
  email?: string;
};

type UploadedDoc = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: 'CERTIFICATE' | 'DIPLOMA';
  file: File;
};

const KAZAKHSTAN_CITIES = [
  'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar',
  'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay', 'Kyzylorda', 'Uralsk',
  'Petropavlovsk', 'Aktau', 'Temirtau', 'Turkistan', 'Kokshetau', 'Taldykorgan',
  'Ekibastuz', 'Rudny', 'Zhezkazgan'
] as const;

const SKILL_SUGGESTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'SQL', 'PostgreSQL', 'React', 'Next.js', 'Node.js',
  'Flask', 'Django', 'FastAPI', 'Docker', 'Git', 'REST API', 'Telegram Bot API', 'Figma',
  'UI/UX', 'Product Management', 'Data Analysis', 'Machine Learning', 'QA Testing', 'HTML',
  'CSS', 'Tailwind', 'Java', 'C++', 'C#', 'PHP'
] as const;

const INTEREST_SUGGESTIONS = [
  'Backend Development', 'Frontend Development', 'Data Science', 'Machine Learning',
  'Product Management', 'Analytics', 'UI Design', 'DevOps', 'Cybersecurity', 'Mobile Development'
] as const;

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
  completion: 0,
  updatedAt: ''
};

function toCsv(arr: string[]) {
  return arr.join(', ');
}

function fromCsv(value: string) {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function computeCompletionLocal(profile: Record<string, any>) {
  const checks = [
    profile.fullName,
    profile.university,
    profile.city,
    profile.phone,
    profile.birthDate,
    profile.bio,
    profile.about,
    profile.skills?.length ? 'ok' : '',
    profile.interests?.length ? 'ok' : '',
    profile.githubUrl,
    profile.linkedinUrl,
    profile.experienceLevel,
    profile.availabilityStatus,
    profile.workplaceType,
    profile.headline,
    profile.preferredRoles
  ];
  const filled = checks.filter((x) => String(x || '').trim()).length;
  return Math.round((filled / checks.length) * 100);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TagInput({
  label,
  items,
  onChange,
  suggestions,
  placeholder
}: {
  label: string;
  items: string[];
  onChange: (value: string[]) => void;
  suggestions: readonly string[];
  placeholder: string;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => suggestions.filter((x) => x.toLowerCase().includes(query.toLowerCase()) && !items.includes(x)).slice(0, 6),
    [query, suggestions, items]
  );

  const add = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (items.some((item) => item.toLowerCase() === normalized.toLowerCase())) return;
    onChange([...items, normalized]);
    setQuery('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {item}
              <button type="button" onClick={() => onChange(items.filter((x) => x !== item))} className="text-blue-500 hover:text-blue-700">×</button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add(query);
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder={placeholder}
          />
          <button type="button" onClick={() => add(query)} className="rounded-lg border border-slate-200 px-3 text-sm hover:bg-slate-50">+</button>
        </div>
        {!!filtered.length && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filtered.map((item) => (
              <button type="button" key={item} onClick={() => add(item)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [editMode, setEditMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  const [form, setForm] = useState({
    fullName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    email: '',
    country: 'Kazakhstan',
    phonePrivacy: 'PUBLIC',
    birthDatePrivacy: 'PRIVATE',
    university: '',
    city: '',
    workplaceType: 'REMOTE',
    bio: '',
    about: '',
    headline: '',
    experience: '',
    projects: '',
    languages: '',
    achievements: '',
    volunteering: '',
    preferredRoles: '',
    skills: [] as string[],
    interests: [] as string[],
    certificates: [] as string[],
    portfolioLinks: '' as string,
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
        const [firstName, ...rest] = String(data.fullName || '').split(' ');
        setForm((prev) => ({
          ...prev,
          fullName: firstName || '',
          lastName: rest.join(' '),
          email: data.email || '',
          university: data.university || '',
          city: data.city || '',
          bio: data.bio || '',
          about: data.about || '',
          skills: data.skills || [],
          interests: data.interests || [],
          certificates: data.certificates || [],
          portfolioLinks: toCsv(data.portfolioLinks || []),
          githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          experienceLevel: data.experienceLevel || 'JUNIOR',
          availabilityStatus: data.availabilityStatus || 'AVAILABLE'
        }));
        setEditMode(false);
      } catch (err: any) {
        setError(err?.message || 'Could not load profile');
        setEditMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredUniversities = useMemo(() => {
    if (!form.university) return KAZAKHSTAN_UNIVERSITIES.slice(0, 8);
    return KAZAKHSTAN_UNIVERSITIES.filter((u) => u.toLowerCase().includes(form.university.toLowerCase())).slice(0, 8);
  }, [form.university]);

  const filteredCities = useMemo(() => {
    if (!form.city) return KAZAKHSTAN_CITIES;
    return KAZAKHSTAN_CITIES.filter((c) => c.toLowerCase().includes(form.city.toLowerCase()));
  }, [form.city]);

  const localCompletion = useMemo(() => computeCompletionLocal(form), [form]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.university || !form.city || !form.skills.length || !form.interests.length) {
      setError('Please fill required fields: university, city, skills, and interests.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university: form.university,
          city: form.city,
          bio: form.bio,
          about: form.about,
          skills: form.skills,
          interests: form.interests,
          certificates: [...form.certificates, ...docs.map((d) => `${d.type}:${d.name}`)],
          portfolioLinks: fromCsv(form.portfolioLinks),
          githubUrl: form.githubUrl,
          linkedinUrl: form.linkedinUrl,
          experienceLevel: form.experienceLevel,
          availabilityStatus: form.availabilityStatus
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Failed to save profile');
      }
      setProfile(payload.data as ProfileData);
      setMessage('Profile updated successfully.');
      setEditMode(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const handlePdfUpload = (files: FileList | null, type: UploadedDoc['type']) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF size must be up to 10 MB.');
      return;
    }
    setDocs((prev) => [...prev, {
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      type,
      file
    }]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, type: UploadedDoc['type']) => {
    e.preventDefault();
    handlePdfUpload(e.dataTransfer.files, type);
  };

  if (loading) {
    return <div className="card p-8">Loading profile workspace...</div>;
  }

  return (
    <div className="space-y-6 py-2">
      {(error || message) && <div className={`card p-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || message}</div>}

      <section className="card overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6 -mt-8">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md flex items-center justify-center text-xl font-bold text-slate-700">
              {String(form.fullName || profile.fullName || 'U').slice(0, 1)}
            </div>
            <div>
              <h1 className="section-title">{form.fullName || profile.fullName || 'Your profile'}</h1>
              <p className="muted">{form.headline || 'Build a strong profile to unlock better project matches.'}</p>
              <p className="mt-1 text-xs text-slate-500">Last updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'just now'}</p>
            </div>
          </div>
          <div className="min-w-56 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Profile completeness</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{localCompletion}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${localCompletion}%` }} />
            </div>
          </div>
        </div>
      </section>

      {!editMode ? (
        <section className="card p-6">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Profile preview</h2>
            <button type="button" onClick={() => setEditMode(true)} className="btn-secondary">Edit profile</button>
          </div>
          <p className="mt-3 text-sm text-slate-600">{profile.about || profile.bio || 'No summary yet.'}</p>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="First name" />
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Last name" />
              <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input value={form.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value.replace(/[^\d+()\-\s]/g, '') })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Phone number" />
              <input value={form.email} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" placeholder="Email" />
              <input value={form.country} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" />
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Search or type university" />
                {!!filteredUniversities.length && (
                  <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 p-2">
                    {filteredUniversities.map((u) => (
                      <button key={u} type="button" onClick={() => setForm({ ...form, university: u })} className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-50">{u}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Search city" />
                {!!filteredCities.length && (
                  <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 p-2">
                    {filteredCities.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, city: c })} className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-50">{c}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <TagInput label="Skills" items={form.skills} onChange={(skills) => setForm({ ...form, skills })} suggestions={SKILL_SUGGESTIONS} placeholder="Type a skill and press Enter" />
              <TagInput label="Interests" items={form.interests} onChange={(interests) => setForm({ ...form, interests })} suggestions={INTEREST_SUGGESTIONS} placeholder="Type an interest and press Enter" />
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Certificates & Diplomas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(['CERTIFICATE', 'DIPLOMA'] as const).map((docType) => (
                <div key={docType} onDrop={(e) => onDrop(e, docType)} onDragOver={(e) => e.preventDefault()} className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center">
                  <p className="text-sm font-medium text-slate-700">{docType === 'CERTIFICATE' ? 'Certificates' : 'Diplomas'}</p>
                  <p className="mt-1 text-xs text-slate-500">Drop PDF here or use upload button</p>
                  <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                    Upload PDF
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdfUpload(e.target.files, docType)} />
                  </label>
                </div>
              ))}
            </div>
            {!docs.length ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No documents uploaded yet.</div>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">📄 {doc.name}</p>
                      <p className="text-xs text-slate-500">{doc.type} · {formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => window.open(URL.createObjectURL(doc.file), '_blank')} className="rounded-md border border-slate-200 px-3 py-1 text-xs">Preview</button>
                      <button type="button" onClick={() => {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(doc.file);
                        a.download = doc.name;
                        a.click();
                      }} className="rounded-md border border-slate-200 px-3 py-1 text-xs">Download</button>
                      <button type="button" onClick={() => setDocs((prev) => prev.filter((x) => x.id !== doc.id))} className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Career Preferences</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <select value={form.workplaceType} onChange={(e) => setForm({ ...form, workplaceType: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="OFFICE">Office</option>
              </select>
              <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="INTERN">Intern</option>
                <option value="JUNIOR">Junior</option>
                <option value="MIDDLE">Middle</option>
                <option value="SENIOR">Senior</option>
              </select>
              <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                <option value="AVAILABLE">Available</option>
                <option value="OPEN_TO_OFFERS">Open to offers</option>
                <option value="NOT_AVAILABLE">Not available</option>
              </select>
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Additional Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Professional headline" />
              <input value={form.preferredRoles} onChange={(e) => setForm({ ...form, preferredRoles: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Preferred roles" />
              <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="min-h-24 rounded-xl border border-slate-200 px-4 py-2.5 text-sm md:col-span-2" placeholder="About" />
              <textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Experience" />
              <textarea value={form.projects} onChange={(e) => setForm({ ...form, projects: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Projects" />
              <textarea value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Languages" />
              <textarea value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Achievements" />
              <textarea value={form.volunteering} onChange={(e) => setForm({ ...form, volunteering: e.target.value })} className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="Volunteering" />
              <input value={form.portfolioLinks} onChange={(e) => setForm({ ...form, portfolioLinks: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm md:col-span-2" placeholder="Portfolio links (comma separated)" />
              <input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="GitHub URL" />
              <input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" placeholder="LinkedIn URL" />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
            <button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving profile...' : 'Save profile'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
