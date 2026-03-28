'use client';

import { useState } from 'react';

export default function RecommendPage() {
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('junior');
  const [employment, setEmployment] = useState('');
  const [city, setCity] = useState('almaty');
  const [interests, setInterests] = useState('');
  const [topN, setTopN] = useState(10);
  const [strictCity, setStrictCity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          skills,
          experience,
          employment,
          city,
          interests,
          top_n: topN,
          strict_city: strictCity
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setResults(data.recommendations || data?.data?.recommendations || null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Project Recommendations</h1>

      <div className="mb-6 grid gap-4 card p-5">
        <textarea
          className="rounded-lg border p-3"
          placeholder="Skills"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <input
          className="rounded-lg border p-3"
          placeholder="Experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
        <input
          className="rounded-lg border p-3"
          placeholder="Employment Type"
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
        />
        <input
          className="rounded-lg border p-3"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="rounded-lg border p-3"
          placeholder="Interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />

        <input
          className="rounded-lg border p-3"
          type="number"
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={strictCity}
            onChange={(e) => setStrictCity(e.target.checked)}
          />
          Strict city match
        </label>

        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {results && (
        <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </main>
  );
}
