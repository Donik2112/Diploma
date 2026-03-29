'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ProjectDetails() {
  const [project, setProject] = useState<any>(null);
  const [message, setMessage] = useState('');
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((payload) => setProject(payload.data));
  }, [id]);

  async function apply() {
    if (!id) return;
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, coverLetter: 'I am interested in this project and can deliver quality results on time.', proposedPrice: project?.budgetMin || 300, estimatedDuration: '14 days' })
    });
    const payload = await res.json();
    setMessage(res.ok ? 'Application sent successfully.' : payload?.error?.message || 'Failed to apply.');
  }

  if (!project) return <div className="card p-6">Loading project...</div>;
  return <div className="card p-6 space-y-3"><h1 className="text-3xl font-bold">{project.title}</h1><p>{project.description}</p><p><b>Skills:</b> {(project.requiredSkills || []).join(', ')}</p><p><b>Budget:</b> ${project.budgetMin} - ${project.budgetMax}</p><p><b>Deadline:</b> {new Date(project.deadline).toLocaleDateString()}</p><button onClick={apply} className="px-4 py-2 bg-brand text-white rounded-lg w-fit">Apply to project</button>{message && <p className="text-sm">{message}</p>}</div>;
}
