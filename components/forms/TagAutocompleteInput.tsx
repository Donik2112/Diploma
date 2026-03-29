'use client';

import { useMemo, useState } from 'react';

type Props = {
  label: string;
  values: string[];
  suggestions: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
};

export default function TagAutocompleteInput({ label, values, suggestions, placeholder, onChange }: Props) {
  const [query, setQuery] = useState('');
  const normalized = useMemo(() => values.map((v) => v.toLowerCase()), [values]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions.filter((s) => !normalized.includes(s.toLowerCase())).slice(0, 8);
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !normalized.includes(s.toLowerCase())).slice(0, 8);
  }, [query, suggestions, normalized]);

  function addTag(value: string) {
    const tag = value.trim();
    if (!tag) return;
    if (normalized.includes(tag.toLowerCase())) return;
    onChange([...values, tag]);
    setQuery('');
  }

  function removeTag(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="space-y-2">
      <label className="font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="px-2 py-1 text-sm rounded-full border bg-slate-50">
            {value}
            <button type="button" className="ml-2 text-red-600" onClick={() => removeTag(value)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(query);
            }
          }}
          className="border p-2 rounded w-full"
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button type="button" onClick={() => addTag(query)} className="px-3 py-2 border rounded">Add</button>
      </div>
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="px-2 py-1 text-sm rounded border bg-white hover:bg-slate-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
