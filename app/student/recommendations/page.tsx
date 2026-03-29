'use client';

import { useEffect, useMemo, useState } from 'react';

type JobRecommendation = {
  id?: string;
  job_title?: string;
  text?: string;
  city?: string;
  employment_type?: string;
  experience_level?: string;
  salary?: string;
  job_family?: string;
  match_reason?: string;
  final_score?: number | string;
};

function scoreToMatchPercent(finalScore: unknown): number {
  const score = Number(finalScore);
  if (!Number.isFinite(score)) return 60;
  if (score >= 5) return 95;
  if (score >= 4) return 90;
  if (score >= 3) return 85;
  if (score >= 2) return 78;
  if (score >= 1) return 70;
  return 60;
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function extractRecommendations(payload: any): JobRecommendation[] {
  const rows =
    payload?.data?.recommendations ??
    payload?.recommendations ??
    payload?.data ??
    [];
  return Array.isArray(rows) ? rows : [];
}

export default function RecommendationsPage() {
  const [items, setItems] = useState<JobRecommendation[]>([]);
  const [source, setSource] = useState('Loading...');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');

  useEffect(() => {
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ top_n: 8 })
    })
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.error) throw new Error(payload.error);
        setItems(extractRecommendations(payload));
        setSource(payload?.source || payload?.data?.source || 'ML API');
        const warnings = payload?.warnings || payload?.data?.warnings || [];
        if (Array.isArray(warnings) && warnings.length) setWarning(String(warnings[0]));
      })
      .catch((err: any) => {
        console.error('RECOMMENDATIONS PAGE ERROR:', err);
        setError(err?.message || 'Could not load recommendations');
        setSource('ML API');
      });
  }, []);

  const rendered = useMemo(() => {
    const arr = [...items];
    if (sort === 'title') {
      arr.sort((a, b) =>
        String(a.job_title || '').localeCompare(String(b.job_title || ''))
      );
    } else {
      arr.sort((a, b) => Number(b.final_score || 0) - Number(a.final_score || 0));
    }
    return arr;
  }, [items, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Recommended Jobs</h1>
        <select className="rounded px-3 py-1 border" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="match">Sort by match score</option>
          <option value="title">Sort by title</option>
        </select>
      </div>

      <div className="card p-3 text-sm text-slate-600">Recommendation source: {source}</div>
      {warning && <div className="card p-3 text-sm text-amber-700">{warning}</div>}
      {error && <div className="card p-3 text-sm text-red-600">{error}</div>}

      {!error && rendered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl">🧭</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">No matching recommendations found</h2>
          <p className="mt-1 text-sm text-slate-600">Try adding more skills or broadening your city filter in profile settings.</p>
        </div>
      )}

      {rendered.map((i, idx) => (
        <div key={i.id || `${i.job_title || 'job'}-${idx}`} className="card p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">{i.job_title || `Recommendation #${idx + 1}`}</h3>
            <span className="text-brand font-semibold">
              {scoreToMatchPercent(i.final_score)}% match
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {truncateText(i.text || 'No description provided.', 220)}
          </p>
          <div className="mt-2 grid gap-1 text-xs text-slate-500 md:grid-cols-4">
            <p>City: {i.city || 'Not specified'}</p>
            <p>Employment: {i.employment_type || 'Not specified'}</p>
            <p>Experience: {i.experience_level || 'Not specified'}</p>
            <p>Salary: {i.salary || 'Not specified'}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Family: <span className="font-medium text-slate-700">{i.job_family || 'Not specified'}</span>
          </p>
          <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
            {i.match_reason || 'Match explanation is not available yet.'}
          </p>
        </div>
      ))}
    </div>
  );
}
