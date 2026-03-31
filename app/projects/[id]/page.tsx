'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type AssistantAction = 'why_recommended' | 'vacancy_analysis' | 'cover_letter';

export default function ProjectDetails() {
  const [project, setProject] = useState<any>(null);
  const [message, setMessage] = useState('');
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((payload) => setProject(payload.data));
  }, [id]);

  const openAssistant = (action?: AssistantAction) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('uniwork-ai-open', { detail: { projectId: id, action } }));
  };

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
  return (
    <div className="card space-y-4 p-6">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p>{project.description}</p>
      <p><b>Skills:</b> {(project.requiredSkills || []).join(', ')}</p>
      <p><b>Budget:</b> ${project.budgetMin} - ${project.budgetMax}</p>
      <p><b>Deadline:</b> {new Date(project.deadline).toLocaleDateString()}</p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => openAssistant()} className="btn-primary">Ask AI</button>
        <button onClick={() => openAssistant('why_recommended')} className="btn-secondary">Why recommended?</button>
        <button onClick={() => openAssistant('vacancy_analysis')} className="btn-secondary">Analyze this vacancy</button>
        <button onClick={() => openAssistant('cover_letter')} className="btn-secondary">Generate cover letter</button>
      </div>

      <button onClick={apply} className="w-fit rounded-lg bg-brand px-4 py-2 text-white">Apply to project</button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
