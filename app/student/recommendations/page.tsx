'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type RecommendationMode = 'blocked' | 'preliminary' | 'ready';

type Readiness = {
  recommendationMode: RecommendationMode;
  missingFields: string[];
  completenessPercent: number;
};

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [source, setSource] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');
  const [blockedMessage, setBlockedMessage] = useState('');
  const [readiness, setReadiness] = useState<Readiness | null>(null);

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
            completenessPercent: profile?.completeness?.percent || 0,
            top_n: 8
          })
        });
      })
      .then((r) => (r ? r.json() : null))
      .then((payload) => {
        if (!payload) return;
        const data = payload?.data || payload;
        setItems(data.recommendations || []);
        setSource(data.source || 'Preliminary recommendations');
        setReadiness(data.profileReadiness || null);
      });
  }, []);

  if (blockedMessage) {
    return <div className="card p-4">{blockedMessage}</div>;
  }

  const rendered = useMemo(() => {
    const arr = [...items];
    if (sort === 'title' || readiness?.recommendationMode !== 'ready') arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => b.matchScore - a.matchScore);
    return arr;
  }, [items, sort, readiness?.recommendationMode]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recommended Projects</h1>
        <select className="border rounded px-3 py-1" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="match">Sort by match score</option>
          <option value="title">Sort by title</option>
        </select>
      </div>

      {readiness?.recommendationMode === 'blocked' && (
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-lg">Your profile is incomplete</h2>
          <p className="text-sm text-slate-600">Complete your profile to get personalized recommendations.</p>
          {readiness.missingFields.length > 0 && (
            <ul className="text-sm text-slate-600 list-disc ml-5">
              {readiness.missingFields.map((field) => <li key={field}>{field}</li>)}
            </ul>
          )}
          <p className="text-sm text-slate-600">Profile completeness: {readiness.completenessPercent}%</p>
          <Link href="/student/profile" className="inline-block px-3 py-1.5 rounded bg-brand text-white text-sm">Complete profile</Link>
        </div>
      )}

      {readiness?.recommendationMode === 'preliminary' && (
        <div className="card p-4">
          <p className="font-medium">Preliminary recommendations</p>
          <p className="text-sm text-slate-600">Based on limited profile data. Add skills, interests and city for accurate matching.</p>
        </div>
      )}

      <div className="card p-3">Recommendation source: {source || 'Loading...'}</div>
      {readiness?.recommendationMode !== 'blocked' && rendered.map((i) => (
        <div key={i.projectId} className="card p-4 space-y-1">
          <div className="flex justify-between">
            <h3 className="font-semibold">{i.title}</h3>
            {readiness?.recommendationMode === 'ready' && i.showMatchScore
              ? <span className="text-brand font-semibold">{i.matchScorePercent}% match</span>
              : <span className="text-slate-600 font-medium">{i.uiLabel || 'Low-confidence match'}</span>}
          </div>
          <p className="text-sm text-slate-600">{i.explanation}</p>
        </div>
      ))}
    </div>
  );
}
