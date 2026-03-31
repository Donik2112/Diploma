'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

type OpenAssistantDetail = {
  projectId?: string;
  action?: AssistantAction;
};

const GLOBAL_ACTIONS: Array<{ label: string; action: AssistantAction }> = [
  { label: 'Improve my profile', action: 'profile_improvement' },
  { label: 'Best roles for me', action: 'best_roles' },
];

const CONTEXT_ACTIONS: Array<{ label: string; action: AssistantAction }> = [
  { label: 'Explain recommendation', action: 'why_recommended' },
  { label: 'Analyze vacancy', action: 'vacancy_analysis' },
  { label: 'Generate cover letter', action: 'cover_letter' },
];

const WELCOME_MESSAGE =
  'Hi! I can help you improve your profile, identify your best-fit roles, analyze a selected vacancy, explain recommendations, or generate a short cover letter.';

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<AssistantAction | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([{ role: 'assistant', text: WELCOME_MESSAGE }]);

  const pathnameProjectId = useMemo(() => {
    if (!pathname) return '';
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }, [pathname]);

  useEffect(() => {
    if (pathnameProjectId) {
      setSelectedProjectId(pathnameProjectId);
    }
  }, [pathnameProjectId]);

  const runAction = useCallback(async (action: AssistantAction, label: string, projectIdOverride?: string) => {
    const projectId = projectIdOverride || selectedProjectId;
    const needsProject = action === 'why_recommended' || action === 'vacancy_analysis' || action === 'cover_letter';

    setHistory((prev) => [...prev, { role: 'user', text: label }]);

    if (needsProject && !projectId) {
      setHistory((prev) => [...prev, { role: 'assistant', text: 'Select a project or recommendation first.' }]);
      return;
    }

    setBusyAction(action);
    try {
      const body: { action: AssistantAction; projectId?: string } = { action };
      if (needsProject) body.projectId = projectId;

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as AssistantResponse;
      if (!res.ok) {
        setHistory((prev) => [...prev, { role: 'assistant', text: data.error || 'Assistant request failed.' }]);
        return;
      }

      const answer = data.answer || 'No answer received.';
      const suffix = typeof data.profileCompleteness === 'number' ? `\n\nProfile completeness: ${data.profileCompleteness}%` : '';
      setHistory((prev) => [...prev, { role: 'assistant', text: `${answer}${suffix}` }]);
    } catch (e: any) {
      setHistory((prev) => [...prev, { role: 'assistant', text: e?.message || 'Assistant request failed.' }]);
    } finally {
      setBusyAction(null);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const openHandler = (event: Event) => {
      const customEvent = event as CustomEvent<OpenAssistantDetail>;
      const detail = customEvent.detail || {};
      if (detail.projectId) setSelectedProjectId(detail.projectId);
      setOpen(true);
      if (detail.action) {
        const actionDef = [...GLOBAL_ACTIONS, ...CONTEXT_ACTIONS].find((x) => x.action === detail.action);
        if (actionDef) {
          runAction(actionDef.action, actionDef.label, detail.projectId);
        }
      }
    };

    window.addEventListener('uniwork-ai-open', openHandler as EventListener);
    return () => window.removeEventListener('uniwork-ai-open', openHandler as EventListener);
  }, [runAction]);

  const contextualHint = selectedProjectId
    ? 'Context actions are enabled for the selected project.'
    : 'Context actions require a selected project or recommendation.';

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="card mb-3 flex h-[560px] w-[410px] flex-col overflow-hidden bg-white">
          <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">UniWork AI Assistant</p>
              <p className="text-xs text-slate-500">Career and recommendation assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
              Close
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4">
            {history.map((item, idx) => (
              <div
                key={`${item.role}-${idx}`}
                className={`max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                  item.role === 'assistant'
                    ? 'bg-slate-100 text-slate-700'
                    : 'ml-auto bg-blue-600 text-white'
                }`}
              >
                {item.text}
              </div>
            ))}
            {busyAction && (
              <div className="max-w-[92%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                Generating assistant response...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Global actions</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {GLOBAL_ACTIONS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => runAction(item.action, item.label)}
                  disabled={Boolean(busyAction)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contextual actions</p>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_ACTIONS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => runAction(item.action, item.label)}
                  disabled={Boolean(busyAction) || !selectedProjectId}
                  title={!selectedProjectId ? 'Select a project or recommendation first.' : item.label}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{contextualHint}</p>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((x) => !x)} className="btn-primary rounded-full px-5 py-3 shadow-lg">
        {open ? 'Close AI' : 'AI Assistant'}
      </button>
    </div>
  );
}
