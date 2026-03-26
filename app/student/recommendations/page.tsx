'use client';
import { useEffect, useMemo, useState } from 'react';

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [source, setSource] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');

  useEffect(() => {
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: ['Next.js', 'TypeScript', 'UI'], experience: 'JUNIOR', city: 'Almaty', top_n: 8 })
    })
      .then((r) => r.json())
      .then((payload) => {
        const data = payload?.data || payload;
        setItems(data.recommendations || []);
        setSource(data.source || 'fallback demo engine');
      });
  }, []);

  const rendered = useMemo(() => {
    const arr = [...items];
    if (sort === 'title') arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => b.matchScore - a.matchScore);
    return arr;
  }, [items, sort]);

  return <div className="space-y-3"><div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Recommended Projects</h1><select className="border rounded px-3 py-1" value={sort} onChange={(e) => setSort(e.target.value as any)}><option value="match">Sort by match score</option><option value="title">Sort by title</option></select></div><div className="card p-3">Recommendation source: {source || 'Loading...'}</div>{rendered.map((i) => <div key={i.projectId} className="card p-4"><div className="flex justify-between"><h3 className="font-semibold">{i.title}</h3><span className="text-brand font-semibold">{i.matchScorePercent}% match</span></div><p className="text-sm text-slate-600">{i.explanation}</p></div>)}</div>;
}
