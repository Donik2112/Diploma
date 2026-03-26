'use client';
import { useEffect, useState } from 'react';

type Item = { projectId: string; title: string; category: string; city: string; scorePercent: number; explanation: string };

export default function RecommendationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [source, setSource] = useState('');
  useEffect(() => {
    fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ top_n: 12 }) })
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setSource(d.sourceModel || 'unknown'); });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">Recommended Projects</h1>
      <p className="mt-2 text-sm text-slate-600">Recommendation source: {source}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{items.map((i) => <div key={i.projectId} className="card"><p className="font-semibold">{i.title}</p><p className="text-sm">{i.category} • {i.city}</p><p className="mt-2 text-sm">Match score: {i.scorePercent}%</p><p className="text-xs text-slate-600">{i.explanation}</p></div>)}</div>
    </div>
  );
}
