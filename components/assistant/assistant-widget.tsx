'use client';

import { useState } from 'react';

type ChatItem = { role: 'user' | 'assistant'; text: string };

const QUICK_ACTIONS = [
  'Find projects that match my skills',
  'How can I improve my profile?',
  'Generate a concise project brief',
  'Why was this project recommended to me?'
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([
    { role: 'assistant', text: 'Hi! I can help with profile quality, project fit, and recommendation insights.' }
  ]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setBusy(true);
    setHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setPrompt('');
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed })
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { role: 'assistant', text: data.reply || 'I could not generate a suggestion right now.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="card mb-3 w-[360px] overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">UniWork AI Assistant</p>
            <p className="text-xs text-slate-500">Profile help · project fit · recommendation insights</p>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
            {history.map((item, idx) => (
              <div key={`${item.role}-${idx}`} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${item.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'ml-auto bg-blue-600 text-white'}`}>
                {item.text}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => ask(action)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about profile, projects, or recommendations..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
              />
              <button type="button" onClick={() => ask(prompt)} disabled={busy} className="btn-primary disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((x) => !x)} className="btn-primary rounded-full px-5 py-3 shadow-lg">
        {open ? 'Close AI' : 'AI Assistant'}
      </button>
    </div>
  );
}
