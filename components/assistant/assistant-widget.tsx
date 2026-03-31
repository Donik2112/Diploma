'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type AssistantAction =
  | 'why_recommended'
  | 'profile_improvement'
  | 'best_roles'
  | 'vacancy_analysis'
  | 'cover_letter';

type AssistantResponse = {
  answer?: string;
  action?: AssistantAction;
  profileCompleteness?: number;
  error?: string;
};

const ACTIONS: Array<{ label: string; action: AssistantAction; needsProject: boolean }> = [
  { label: 'Improve my profile', action: 'profile_improvement', needsProject: false },
  { label: 'Best roles for me', action: 'best_roles', needsProject: false },
  { label: 'Explain recommendation', action: 'why_recommended', needsProject: true },
  { label: 'Analyze vacancy', action: 'vacancy_analysis', needsProject: true },
  { label: 'Generate cover letter', action: 'cover_letter', needsProject: true },
];

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<AssistantAction | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AssistantResponse | null>(null);

  const projectId = useMemo(() => {
    if (!pathname) return '';
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }, [pathname]);

  const runAction = async (action: AssistantAction, needsProject: boolean) => {
    setError('');
    setBusyAction(action);
    try {
      const body: { action: AssistantAction; projectId?: string } = { action };
      if (needsProject && projectId) {
        body.projectId = projectId;
      }
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as AssistantResponse;
      if (!res.ok) {
        setError(data.error || 'Assistant request failed.');
        return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Assistant request failed.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="card mb-3 w-[390px] overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">UniWork AI Assistant</p>
            <p className="text-xs text-slate-500">Recommendation-aware advisory assistant</p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              {ACTIONS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => runAction(item.action, item.needsProject)}
                  disabled={Boolean(busyAction) || (item.needsProject && !projectId)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  title={item.needsProject && !projectId ? 'Open a project details page to use this action.' : item.label}
                >
                  {busyAction === item.action ? 'Running...' : item.label}
                </button>
              ))}
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {result?.answer && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700">
                <p>{result.answer}</p>
                {typeof result.profileCompleteness === 'number' && (
                  <p className="mt-2 text-xs text-slate-500">Profile completeness: {result.profileCompleteness}%</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen((x) => !x)} className="btn-primary rounded-full px-5 py-3 shadow-lg">
        {open ? 'Close AI' : 'AI Assistant'}
      </button>
    </div>
  );
}
