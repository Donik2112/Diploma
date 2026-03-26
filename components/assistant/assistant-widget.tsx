'use client';
import { useState } from 'react';

const actions = ['Help me complete my profile', 'Suggest skills for my target role', 'Help me write a project description', 'Explain why this project matches me'];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const ask = async (prompt: string) => {
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    const res = await fetch('/api/assistant', { method: 'POST', body: JSON.stringify({ prompt }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    setMessages((m) => [...m, { role: 'assistant', text: data.response }]);
  };

  return (
    <div className="fixed bottom-5 right-5">
      <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-brand-600 px-4 py-3 text-sm text-white shadow">AI Assistant</button>
      {open && (
        <div className="mt-3 w-80 rounded-xl border bg-white p-4 shadow-xl">
          <p className="mb-2 text-sm font-semibold">Assistant</p>
          <div className="mb-2 max-h-48 space-y-2 overflow-auto text-sm">
            {messages.length === 0 && <p className="text-slate-500">Choose an action to start.</p>}
            {messages.map((m, i) => <p key={i}><b>{m.role === 'assistant' ? 'Assistant' : 'You'}:</b> {m.text}</p>)}
          </div>
          <div className="space-y-1">
            {actions.map((a) => <button key={a} onClick={() => ask(a)} className="w-full rounded border px-2 py-1 text-left text-xs hover:bg-slate-50">{a}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
