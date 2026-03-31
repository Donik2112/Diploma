'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type AssistantAction = 'why_recommended' | 'vacancy_analysis' | 'cover_letter';

export default function ProjectDetails() {
  const [project, setProject] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [assistantError, setAssistantError] = useState('');
  const [assistantLoading, setAssistantLoading] = useState<AssistantAction | null>(null);
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

  async function runAssistant(action: AssistantAction) {
    if (!id) return;
    setAssistantError('');
    setAssistantLoading(action);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, projectId: id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setAssistantError(payload?.error || 'Assistant request failed.');
        return;
      }
      setAssistantAnswer(String(payload?.answer || 'No assistant answer received.'));
    } finally {
      setAssistantLoading(null);
    }
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
        <button onClick={() => runAssistant('why_recommended')} className="btn-secondary" disabled={Boolean(assistantLoading)}>
          {assistantLoading === 'why_recommended' ? 'Loading...' : 'Why recommended?'}
        </button>
        <button onClick={() => runAssistant('vacancy_analysis')} className="btn-secondary" disabled={Boolean(assistantLoading)}>
          {assistantLoading === 'vacancy_analysis' ? 'Loading...' : 'Analyze this vacancy'}
        </button>
        <button onClick={() => runAssistant('cover_letter')} className="btn-secondary" disabled={Boolean(assistantLoading)}>
          {assistantLoading === 'cover_letter' ? 'Loading...' : 'Generate cover letter'}
        </button>
      </div>

      {(assistantAnswer || assistantError) && (
        <div className={`rounded-xl p-3 text-sm ${assistantError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-slate-700'}`}>
          {assistantError || assistantAnswer}
        </div>
      )}

      <button onClick={apply} className="w-fit rounded-lg bg-brand px-4 py-2 text-white">Apply to project</button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
