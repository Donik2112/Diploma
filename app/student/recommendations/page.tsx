'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Completeness = {
  percent: number;
  missingFields: string[];
  nextRecommendedAction: string;
};

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [source, setSource] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');
  const [blockedMessage, setBlockedMessage] = useState('');
  const [hasEnoughSignals, setHasEnoughSignals] = useState(true);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((mePayload) => {
        const status = mePayload?.data?.approvalStatus;
        if (status && status !== 'APPROVED') {
          setBlockedMessage(status === 'REJECTED' ? 'Your account was rejected by admin.' : 'Your account is under review by admin.');
          return null;
        }
        return fetch('/api/student/profile');
      })
      .then((r) => (r ? r.json() : null))
      .then((profilePayload) => {
        if (!profilePayload) return null;
        const profile = profilePayload?.data || {};
        setCompleteness(profile.completeness || null);
        return fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skills: profile.skills || [],
            interests: profile.interests || [],
            experience: profile.experienceLevel || 'JUNIOR',
            city: profile.city || '',
            summary: profile.about || profile.bio || '',
            educationTrack: profile.university || '',
            top_n: 8
          })
        });
      })
      .then((r) => (r ? r.json() : null))
      .then((payload) => {
        if (!payload) return;
        const data = payload?.data || payload;
        setItems(data.recommendations || []);
        setSource(data.source || 'Starter recommendations');
        setHasEnoughSignals(Boolean(data.hasEnoughSignals));
      });
  }, []);

  if (blockedMessage) {
    return <div className="card p-4">{blockedMessage}</div>;
  }

  const rendered = useMemo(() => {
    const arr = [...items];
    if (sort === 'title' || !hasEnoughSignals) arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => b.matchScore - a.matchScore);
    return arr;
  }, [items, sort, hasEnoughSignals]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recommended Projects</h1>
        <select className="border rounded px-3 py-1" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="match">Sort by match score</option>
          <option value="title">Sort by title</option>
        </select>
      </div>

      {!hasEnoughSignals && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-lg">Недостаточно данных</h2>
          <p className="text-sm text-slate-600">Добавьте минимум 3 навыка, интересы и город, чтобы увидеть персональный мэтч.</p>
          <p className="text-sm text-slate-600">Recommended for you. Based on limited profile data.</p>
          {completeness && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Profile completeness</span>
                <span>{completeness.percent}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded">
                <div className="h-2 bg-brand rounded" style={{ width: `${completeness.percent}%` }} />
              </div>
            </div>
          )}
          <Link href="/student/profile" className="inline-block px-3 py-1.5 rounded bg-brand text-white text-sm">Complete profile</Link>
        </div>
      )}

      <div className="card p-3">Recommendation source: {source || 'Loading...'}</div>
      {rendered.map((i) => (
        <div key={i.projectId} className="card p-4 space-y-1">
          <div className="flex justify-between">
            <h3 className="font-semibold">{i.title}</h3>
            {i.showMatchScore
              ? <span className="text-brand font-semibold">{i.matchScorePercent}% match</span>
              : <span className="text-slate-600 font-medium">{i.uiLabel || 'Preliminary recommendation'}</span>}
          </div>
          <p className="text-sm text-slate-600">{i.explanation}</p>
        </div>
      ))}
    </div>
  );
}
