'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

type CertificateDoc = {
  name: string;
  issuer?: string;
  issueDate?: string;
  expirationDate?: string;
  doesNotExpire?: boolean;
  skillsCovered?: string[];
  description?: string;
  fileName: string;
  fileSize?: number;
  fileDataUrl?: string;
};

type DiplomaDoc = {
  university: string;
  degree?: string;
  fieldOfStudy?: string;
  gpa?: string;
  startYear?: string;
  graduationYear?: string;
  graduated?: boolean;
  expectedGraduationYear?: string;
  notes?: string;
  fileName: string;
  fileSize?: number;
  fileDataUrl?: string;
};

type ProfileData = {
  fullName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  workplaceType?: string;
  university: string;
  city: string;
  bio: string;
  about: string;
  headline?: string;
  experience?: string;
  projects?: string;
  languages?: string;
  achievements?: string;
  volunteering?: string;
  preferredRoles?: string;
  skills: string[];
  interests: string[];
  certificates: string[];
  diplomas?: string[];
  certificateDocuments?: CertificateDoc[];
  diplomaDocuments?: DiplomaDoc[];
  portfolioLinks: string[];
  githubUrl: string;
  linkedinUrl: string;
  avatar?: string;
  avatarDataUrl?: string;
  experienceLevel: string;
  availabilityStatus: string;
  completion: number;
  updatedAt?: string;
};

const CITIES = [
  'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk',
  'Semey', 'Atyrau', 'Kostanay', 'Kyzylorda', 'Uralsk', 'Petropavlovsk', 'Aktau', 'Temirtau',
  'Turkistan', 'Kokshetau', 'Taldykorgan', 'Ekibastuz', 'Rudny', 'Zhezkazgan'
];

const SKILLS = ['Python','JavaScript','TypeScript','SQL','PostgreSQL','React','Next.js','Node.js','Flask','Django','FastAPI','Docker','Git','REST API','Telegram Bot API','Figma','UI/UX','Product Management','Data Analysis','Machine Learning','QA Testing','HTML','CSS','Tailwind','Java','C++','C#','PHP'];
const INTERESTS = ['Data Science','Analytics','Recommendation Systems','Backend','Frontend','Mobile Development','Product Management','Research','Open Source'];

function fromCsv(value: string) {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function toCsv(arr: string[] = []) {
  return arr.join(', ');
}

async function toDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LabeledField({ label, children, helper }: { label: string; children: React.ReactNode; helper?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">{text}</p>;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [edit, setEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [form, setForm] = useState<any>({
    firstName: '', lastName: '', birthDate: '', phone: '', email: '', country: 'Kazakhstan',
    phonePrivacy: 'PUBLIC', birthDatePrivacy: 'PRIVATE',
    university: '', city: '', workplaceType: 'REMOTE',
    headline: '', preferredRoles: '', about: '', bio: '', experience: '', projects: '', languages: '', achievements: '', volunteering: '',
    skills: [] as string[], interests: [] as string[],
    certificates: [] as string[],
    diplomas: [] as string[],
    githubUrl: '', linkedinUrl: '', portfolioLinks: '',
    experienceLevel: 'JUNIOR', availabilityStatus: 'AVAILABLE',
    avatarDataUrl: '',
    avatar: '',
    certificateDocuments: [] as CertificateDoc[],
    diplomaDocuments: [] as DiplomaDoc[]
  });

  const [newCertificate, setNewCertificate] = useState<CertificateDoc>({ name: '', fileName: '' });
  const [newDiploma, setNewDiploma] = useState<DiplomaDoc>({ university: '', fileName: '', graduated: true });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/profile');
        const payload = await res.json();
        if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Failed to load profile');
        const p: ProfileData = payload.data;
        setProfile(p);
        setForm((f: any) => ({
          ...f,
          firstName: p.firstName || p.fullName?.split(' ')[0] || '',
          lastName: p.lastName || p.fullName?.split(' ').slice(1).join(' ') || '',
          email: p.email || '',
          birthDate: p.birthDate || '',
          phone: p.phone || '',
          workplaceType: p.workplaceType || 'REMOTE',
          university: p.university || '',
          city: p.city || '',
          headline: p.headline || '',
          preferredRoles: p.preferredRoles || '',
          about: p.about || '',
          bio: p.bio || '',
          experience: p.experience || '',
          projects: p.projects || '',
          languages: p.languages || '',
          achievements: p.achievements || '',
          volunteering: p.volunteering || '',
          skills: p.skills || [],
          interests: p.interests || [],
          githubUrl: p.githubUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioLinks: toCsv(p.portfolioLinks),
          experienceLevel: p.experienceLevel || 'JUNIOR',
          availabilityStatus: p.availabilityStatus || 'AVAILABLE',
          avatarDataUrl: p.avatarDataUrl || '',
          avatar: p.avatar || p.avatarDataUrl || '',
          certificateDocuments: p.certificateDocuments || [],
          diplomaDocuments: p.diplomaDocuments || [],
          certificates: p.certificates || [],
          diplomas: p.diplomas || []
        }));
        setEdit(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completion = useMemo(() => {
    const checks = [form.firstName, form.lastName, form.university, form.city, form.headline, form.about, form.skills.length, form.interests.length, form.portfolioLinks, form.githubUrl, form.linkedinUrl, form.experienceLevel, form.availabilityStatus];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        phone: form.phone,
        workplaceType: form.workplaceType,
        university: form.university,
        city: form.city,
        bio: form.bio,
        about: form.about,
        headline: form.headline,
        projects: form.projects,
        languages: form.languages,
        achievements: form.achievements,
        volunteering: form.volunteering,
        preferredRoles: form.preferredRoles,
        skills: form.skills,
        interests: form.interests,
        certificates: form.certificateDocuments.map((x: CertificateDoc) => x.name),
        diplomas: form.diplomaDocuments.map((x: DiplomaDoc) => `${x.university} ${x.degree || ''}`.trim()),
        certificateDocuments: form.certificateDocuments,
        diplomaDocuments: form.diplomaDocuments,
        portfolioLinks: fromCsv(form.portfolioLinks),
        githubUrl: form.githubUrl,
        linkedinUrl: form.linkedinUrl,
        avatarDataUrl: form.avatarDataUrl,
        avatar: form.avatarDataUrl,
        experienceLevel: form.experienceLevel,
        availabilityStatus: form.availabilityStatus
      };
      const res = await fetch('/api/student/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save profile');
      setProfile(data.data);
      setOk('Profile saved successfully.');
      setEdit(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (value: string, key: 'skills' | 'interests') => {
    const v = value.trim();
    if (!v) return;
    if (form[key].some((x: string) => x.toLowerCase() === v.toLowerCase())) return;
    setForm({ ...form, [key]: [...form[key], v] });
  };

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Avatar must be an image file.');
    setForm({ ...form, avatarDataUrl: await toDataUrl(file) });
  };

  const uploadCertificateFile = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Certificate file must be PDF.');
    if (file.size > 10 * 1024 * 1024) return setError('Certificate PDF must be <= 10 MB.');
    setNewCertificate({ ...newCertificate, fileName: file.name, fileSize: file.size, fileDataUrl: await toDataUrl(file) });
  };

  const uploadDiplomaFile = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Diploma file must be PDF.');
    if (file.size > 10 * 1024 * 1024) return setError('Diploma PDF must be <= 10 MB.');
    setNewDiploma({ ...newDiploma, fileName: file.name, fileSize: file.size, fileDataUrl: await toDataUrl(file) });
  };

  if (loading) return <div className="card p-8">Loading profile...</div>;

  return (
    <div className="space-y-6 py-2">
      {(error || ok) && <div className={`card p-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || ok}</div>}

      <section className="card overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-indigo-600 to-cyan-500" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
              {form.avatarDataUrl ? <img src={form.avatarDataUrl} alt="avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-600">{(form.firstName || 'U')[0]}</div>}
            </div>
            <div>
              <h1 className="section-title">{`${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Profile'}</h1>
              <p className="muted">{form.headline || 'Add a headline to improve discoverability.'}</p>
              <p className="text-xs text-slate-500">Profile completeness: {completion}%</p>
            </div>
          </div>
          <div className="flex gap-2">
            {edit ? (
              <button type="button" onClick={() => setEdit(false)} className="btn-secondary">Preview profile</button>
            ) : (
              <button type="button" onClick={() => setEdit(true)} className="btn-secondary">Edit profile</button>
            )}
          </div>
        </div>
      </section>

      {edit ? (
        <form onSubmit={save} className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="First Name"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></LabeledField>
              <LabeledField label="Last Name"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></LabeledField>
              <LabeledField label="Date of Birth"><input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></LabeledField>
              <LabeledField label="Phone Number" helper="Only numeric symbols and +()- are allowed."><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+()\-\s]/g, '') })} /></LabeledField>
              <LabeledField label="Email"><input readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={form.email} /></LabeledField>
              <LabeledField label="Country"><input readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value="Kazakhstan" /></LabeledField>
              <LabeledField label="Phone Privacy"><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.phonePrivacy} onChange={(e)=>setForm({...form, phonePrivacy:e.target.value})}><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></LabeledField>
              <LabeledField label="Birth Date Privacy"><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.birthDatePrivacy} onChange={(e)=>setForm({...form, birthDatePrivacy:e.target.value})}><option value="PRIVATE">Private</option><option value="PUBLIC">Public</option></select></LabeledField>
            </div>
            <div className="mt-4">
              <LabeledField label="Avatar Upload" helper="Upload image, preview, replace or remove.">
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={uploadAvatar} />
                  {form.avatarDataUrl && <button type="button" className="rounded-md border px-3 py-1 text-xs" onClick={() => setForm({ ...form, avatarDataUrl: '' })}>Remove</button>}
                </div>
              </LabeledField>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Education</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="University">
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.university} onChange={(e)=>setForm({...form, university:e.target.value})} placeholder="Search or type university" />
                <div className="mt-2 max-h-36 overflow-auto rounded-xl border border-slate-200 p-2">
                  {KAZAKHSTAN_UNIVERSITIES.filter((u)=>u.toLowerCase().includes(form.university.toLowerCase())).slice(0,8).map((u)=><button key={u} type="button" onClick={()=>setForm({...form, university:u})} className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-50">{u}</button>)}
                </div>
              </LabeledField>
              <LabeledField label="City">
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} placeholder="Search city" />
                <div className="mt-2 max-h-36 overflow-auto rounded-xl border border-slate-200 p-2">
                  {CITIES.filter((c)=>c.toLowerCase().includes(form.city.toLowerCase())).map((c)=><button key={c} type="button" onClick={()=>setForm({...form, city:c})} className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-50">{c}</button>)}
                </div>
              </LabeledField>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Skills</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Skills and Topics"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Type and press Enter" onKeyDown={(e)=>{ if(e.key==='Enter'){e.preventDefault(); addSkill((e.target as HTMLInputElement).value,'skills'); (e.target as HTMLInputElement).value='';}}} /><div className="mt-2 flex flex-wrap gap-2">{form.skills.map((x:string)=><span key={x} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{x}</span>)}</div><div className="mt-2 flex flex-wrap gap-1">{SKILLS.slice(0,12).map((s)=><button key={s} type="button" onClick={()=>addSkill(s,'skills')} className="rounded-full border px-2 py-0.5 text-xs">{s}</button>)}</div></LabeledField>
              <LabeledField label="Interests"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Type and press Enter" onKeyDown={(e)=>{ if(e.key==='Enter'){e.preventDefault(); addSkill((e.target as HTMLInputElement).value,'interests'); (e.target as HTMLInputElement).value='';}}} /><div className="mt-2 flex flex-wrap gap-2">{form.interests.map((x:string)=><span key={x} className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">{x}</span>)}</div><div className="mt-2 flex flex-wrap gap-1">{INTERESTS.map((s)=><button key={s} type="button" onClick={()=>addSkill(s,'interests')} className="rounded-full border px-2 py-0.5 text-xs">{s}</button>)}</div></LabeledField>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Certificates</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Certificate Name"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newCertificate.name} onChange={(e)=>setNewCertificate({...newCertificate,name:e.target.value})} /></LabeledField>
              <LabeledField label="Issued By"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newCertificate.issuer||''} onChange={(e)=>setNewCertificate({...newCertificate,issuer:e.target.value})} /></LabeledField>
              <LabeledField label="Issue Date"><input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newCertificate.issueDate||''} onChange={(e)=>setNewCertificate({...newCertificate,issueDate:e.target.value})} /></LabeledField>
              <LabeledField label="Expiration Date"><input type="date" disabled={newCertificate.doesNotExpire} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newCertificate.expirationDate||''} onChange={(e)=>setNewCertificate({...newCertificate,expirationDate:e.target.value})} /></LabeledField>
              <LabeledField label="Does Not Expire"><input type="checkbox" checked={!!newCertificate.doesNotExpire} onChange={(e)=>setNewCertificate({...newCertificate,doesNotExpire:e.target.checked})} /></LabeledField>
              <LabeledField label="Skills/Topics Covered"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={toCsv(newCertificate.skillsCovered||[])} onChange={(e)=>setNewCertificate({...newCertificate,skillsCovered:fromCsv(e.target.value)})} /></LabeledField>
              <LabeledField label="Description"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newCertificate.description||''} onChange={(e)=>setNewCertificate({...newCertificate,description:e.target.value})} /></LabeledField>
              <LabeledField label="Certificate PDF"><input type="file" accept="application/pdf" onChange={(e)=>uploadCertificateFile(e.target.files?.[0])} /></LabeledField>
            </div>
            <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={()=>{ if(!newCertificate.name || !newCertificate.fileName) return setError('Certificate name and PDF are required.'); setForm({...form, certificateDocuments:[...form.certificateDocuments, newCertificate]}); setNewCertificate({name:'', fileName:''}); }}>Add certificate</button>
            <div className="mt-3 space-y-2">{form.certificateDocuments.length?form.certificateDocuments.map((c:CertificateDoc,i:number)=><div key={`${c.name}-${i}`} className="rounded-xl border p-3 text-sm"><p className="font-medium">{c.name}</p><p className="text-xs text-slate-500">{c.issuer || 'Issuer n/a'} · {c.fileName}</p></div>):<EmptyState text="No certificates added yet." />}</div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Diplomas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="University"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.university} onChange={(e)=>setNewDiploma({...newDiploma,university:e.target.value})} /></LabeledField>
              <LabeledField label="Degree"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.degree||''} onChange={(e)=>setNewDiploma({...newDiploma,degree:e.target.value})} /></LabeledField>
              <LabeledField label="Field of Study"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.fieldOfStudy||''} onChange={(e)=>setNewDiploma({...newDiploma,fieldOfStudy:e.target.value})} /></LabeledField>
              <LabeledField label="GPA"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.gpa||''} onChange={(e)=>setNewDiploma({...newDiploma,gpa:e.target.value})} /></LabeledField>
              <LabeledField label="Start Year"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.startYear||''} onChange={(e)=>setNewDiploma({...newDiploma,startYear:e.target.value})} /></LabeledField>
              <LabeledField label="Graduation Year"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.graduationYear||''} onChange={(e)=>setNewDiploma({...newDiploma,graduationYear:e.target.value})} /></LabeledField>
              <LabeledField label="Graduated"><input type="checkbox" checked={!!newDiploma.graduated} onChange={(e)=>setNewDiploma({...newDiploma,graduated:e.target.checked})} /></LabeledField>
              <LabeledField label="Expected Graduation Year"><input disabled={newDiploma.graduated} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.expectedGraduationYear||''} onChange={(e)=>setNewDiploma({...newDiploma,expectedGraduationYear:e.target.value})} /></LabeledField>
              <LabeledField label="Notes"><textarea className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={newDiploma.notes||''} onChange={(e)=>setNewDiploma({...newDiploma,notes:e.target.value})} /></LabeledField>
              <LabeledField label="Diploma PDF"><input type="file" accept="application/pdf" onChange={(e)=>uploadDiplomaFile(e.target.files?.[0])} /></LabeledField>
            </div>
            <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={()=>{ if(!newDiploma.university || !newDiploma.fileName) return setError('Diploma university and PDF are required.'); setForm({...form, diplomaDocuments:[...form.diplomaDocuments, newDiploma]}); setNewDiploma({university:'', fileName:'', graduated:true}); }}>Add diploma</button>
            <div className="mt-3 space-y-2">{form.diplomaDocuments.length?form.diplomaDocuments.map((d:DiplomaDoc,i:number)=><div key={`${d.university}-${i}`} className="rounded-xl border p-3 text-sm"><p className="font-medium">{d.university}</p><p className="text-xs text-slate-500">{d.degree || 'Degree n/a'} · {d.fileName}</p></div>):<EmptyState text="No diplomas added yet." />}</div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Portfolio & Links</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Portfolio Links"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.portfolioLinks} onChange={(e)=>setForm({...form, portfolioLinks:e.target.value})} placeholder="Comma separated links" /></LabeledField>
              <LabeledField label="GitHub URL"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.githubUrl} onChange={(e)=>setForm({...form, githubUrl:e.target.value})} /></LabeledField>
              <LabeledField label="LinkedIn URL"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.linkedinUrl} onChange={(e)=>setForm({...form, linkedinUrl:e.target.value})} /></LabeledField>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Career Preferences</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <LabeledField label="Workplace Type"><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.workplaceType} onChange={(e)=>setForm({...form, workplaceType:e.target.value})}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="OFFICE">Office</option></select></LabeledField>
              <LabeledField label="Career Level"><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.experienceLevel} onChange={(e)=>setForm({...form, experienceLevel:e.target.value})}><option value="INTERN">Intern</option><option value="JUNIOR">Junior</option><option value="MIDDLE">Middle</option><option value="SENIOR">Senior</option></select></LabeledField>
              <LabeledField label="Availability"><select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.availabilityStatus} onChange={(e)=>setForm({...form, availabilityStatus:e.target.value})}><option value="AVAILABLE">Available</option><option value="OPEN_TO_OFFERS">Open to offers</option><option value="NOT_AVAILABLE">Not available</option></select></LabeledField>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label="Professional Headline"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.headline} onChange={(e)=>setForm({...form, headline:e.target.value})} /></LabeledField>
              <LabeledField label="Preferred Roles"><input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.preferredRoles} onChange={(e)=>setForm({...form, preferredRoles:e.target.value})} /></LabeledField>
              <LabeledField label="About"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.about} onChange={(e)=>setForm({...form, about:e.target.value})} /></LabeledField>
              <LabeledField label="Experience"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.experience} onChange={(e)=>setForm({...form, experience:e.target.value})} /></LabeledField>
              <LabeledField label="Projects"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.projects} onChange={(e)=>setForm({...form, projects:e.target.value})} /></LabeledField>
              <LabeledField label="Languages"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.languages} onChange={(e)=>setForm({...form, languages:e.target.value})} /></LabeledField>
              <LabeledField label="Achievements"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.achievements} onChange={(e)=>setForm({...form, achievements:e.target.value})} /></LabeledField>
              <LabeledField label="Volunteering"><textarea className="min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.volunteering} onChange={(e)=>setForm({...form, volunteering:e.target.value})} /></LabeledField>
            </div>
          </section>

          <div className="flex justify-end"><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving profile...' : 'Save profile'}</button></div>
        </form>
      ) : (
        <div className="space-y-6">
          <section className="card p-6"><h2 className="text-lg font-semibold">About</h2><p className="mt-2 text-sm text-slate-600">{form.about || 'No about information yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Skills</h2><div className="mt-2 flex flex-wrap gap-2">{form.skills.length?form.skills.map((x:string)=><span key={x} className="pill">{x}</span>):<EmptyState text="No skills yet." />}</div></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Education</h2><p className="mt-2 text-sm">{form.university || 'University not set'} · {form.city || 'City not set'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Certificates</h2>{form.certificateDocuments.length?form.certificateDocuments.map((x:CertificateDoc,i:number)=><p key={i} className="mt-2 text-sm">{x.name} — {x.issuer || 'Issuer n/a'}</p>):<EmptyState text="No certificates yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Diplomas</h2>{form.diplomaDocuments.length?form.diplomaDocuments.map((x:DiplomaDoc,i:number)=><p key={i} className="mt-2 text-sm">{x.university} — {x.degree || 'Degree n/a'}</p>):<EmptyState text="No diplomas yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Projects</h2><p className="mt-2 text-sm text-slate-600">{form.projects || 'No projects information yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Languages</h2><p className="mt-2 text-sm text-slate-600">{form.languages || 'No languages yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Achievements</h2><p className="mt-2 text-sm text-slate-600">{form.achievements || 'No achievements yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Volunteering</h2><p className="mt-2 text-sm text-slate-600">{form.volunteering || 'No volunteering details yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Portfolio</h2>{fromCsv(form.portfolioLinks).length?fromCsv(form.portfolioLinks).map((x:string)=><a key={x} href={x} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-blue-700 underline">{x}</a>):<EmptyState text="No portfolio links yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Career Preferences</h2><p className="mt-2 text-sm">{form.workplaceType} · {form.experienceLevel} · {form.availabilityStatus}</p></section>
        </div>
      )}
    </div>
  );
}
