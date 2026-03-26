'use client';
import { useEffect, useState } from 'react';

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [source, setSource] = useState('');
  useEffect(() => {
    fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skills: ['Next.js','TypeScript','UI'], experience: 'JUNIOR', city: 'Almaty', top_n: 8 }) })
      .then((r)=>r.json()).then((d)=>{setItems(d.recommendations || []); setSource(d.source);});
  }, []);
  return <div className="space-y-3"><h1 className="text-3xl font-bold">Recommended Projects</h1><div className="card p-3">Recommendation source: {source || 'Loading...'}</div>{items.map((i) => <div key={i.projectId} className="card p-4"><div className="flex justify-between"><h3 className="font-semibold">{i.title}</h3><span className="text-brand font-semibold">{i.matchScorePercent}% match</span></div><p className="text-sm text-slate-600">{i.explanation}</p></div>)}</div>;
}
