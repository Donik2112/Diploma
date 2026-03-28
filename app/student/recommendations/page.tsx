'use client';

import { useEffect, useMemo, useState } from 'react';

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
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
        const rows = payload?.data?.recommendations || payload?.recommendations || [];
        setItems(Array.isArray(rows) ? rows : []);
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
    if (sort === 'title') arr.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    else arr.sort((a, b) => Number(b.matchScore || b.score || 0) - Number(a.matchScore || a.score || 0));
    return arr;
  }, [items, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Recommended Projects</h1>
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
        <div key={i.projectId || i.id || idx} className="card p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">{i.title || `Recommendation #${idx + 1}`}</h3>
            <span className="text-brand font-semibold">{i.matchScorePercent || (i.score ? `${Math.round(Number(i.score) * 100)}% match` : 'ML match')}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{i.explanation || i.short_description || i.description || 'No description provided.'}</p>
          <div className="mt-2 grid gap-1 text-xs text-slate-500 md:grid-cols-3">
            <p>City: {i.city || 'Not specified'}</p>
            <p>Employment: {i.employmentType || i.employment || 'Not specified'}</p>
            <p>Experience: {i.experienceLevel || i.experience || 'Not specified'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
