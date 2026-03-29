'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  canRenderMatchPercent,
  extractRecommendations,
  getScoreRange,
  JobRecommendation,
  scoreToPercent,
  trimDescription,
} from '@/lib/jobRecommendations';
import { ProfileReadiness } from '@/lib/profileReadiness';

export default function RecommendationsPage() {
  const [items, setItems] = useState<JobRecommendation[]>([]);
  const [source, setSource] = useState('Loading...');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');
  const [profileReadiness, setProfileReadiness] = useState<ProfileReadiness>({
    completenessPercent: 0,
    missingFields: [],
    recommendationMode: 'ready',
  });

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
        if (payload?.profileReadiness) {
          setProfileReadiness(payload.profileReadiness);
        }
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
  const { minScore, maxScore } = useMemo(() => getScoreRange(rendered), [rendered]);
  const showPercent =
    profileReadiness.recommendationMode === 'ready' &&
    canRenderMatchPercent(minScore, maxScore);

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
      {profileReadiness.recommendationMode === 'preliminary' && (
        <div className="card p-3 text-sm text-blue-700">
          Preliminary recommendations — finish your profile for higher-confidence ML matches.
        </div>
      )}
      {warning && <div className="card p-3 text-sm text-amber-700">{warning}</div>}
      {error && <div className="card p-3 text-sm text-red-600">{error}</div>}

      {!error && profileReadiness.recommendationMode === 'blocked' && (
        <div className="card p-6 text-center">
          <p className="text-xl font-semibold text-slate-900">Complete your profile to get personalized recommendations</p>
          <p className="mt-2 text-sm text-slate-600">
            Missing fields: {profileReadiness.missingFields.join(', ') || 'skills, interests, city, experienceLevel'}
          </p>
          <Link
            href="/student/profile"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Complete profile
          </Link>
        </div>
      )}

      {!error && profileReadiness.recommendationMode !== 'blocked' && rendered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl">🧭</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">No matching recommendations found</h2>
          <p className="mt-1 text-sm text-slate-600">Try adding more skills or broadening your city filter in profile settings.</p>
        </div>
      )}

      {profileReadiness.recommendationMode !== 'blocked' && rendered.map((i, idx) => (
        <div key={i.vacancy_id || `${i.job_title || 'job'}-${idx}`} className="card p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">{i.job_title || `Recommendation #${idx + 1}`}</h3>
            {showPercent ? (
              <span className="text-brand font-semibold">
                {scoreToPercent(Number(i.final_score), minScore, maxScore)}% match
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {profileReadiness.recommendationMode === 'preliminary'
                  ? 'Preliminary'
                  : profileReadiness.recommendationMode === 'blocked'
                    ? 'Profile incomplete'
                    : 'Low-confidence match'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {trimDescription(i.text || 'No description provided.', 240)}
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
            {trimDescription(i.match_reason || 'Match explanation is not available yet.', 180)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {i.vacancy_id ? (
              <Link
                href={`/projects/${encodeURIComponent(i.vacancy_id)}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                View details
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400"
                title="Vacancy ID is not available for this recommendation."
              >
                View details
              </button>
            )}
            <button
              type="button"
              disabled
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500"
              title="Application flow will be connected after vacancy-to-project mapping."
            >
              Apply now
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Application flow will be connected next after mapping ML vacancy IDs to platform project records.
          </p>
        </div>
      ))}
    </div>
  );
}
