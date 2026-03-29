'use client';

import { useMemo, useState } from 'react';

const dialogs = [
  { id: 'd1', name: 'Alem Tech', project: 'Dashboard redesign for analytics SaaS', unread: 2, status: 'In progress' },
  { id: 'd2', name: 'Nexus Studio', project: 'Mobile onboarding flow optimization', unread: 0, status: 'Review' },
  { id: 'd3', name: 'Qadam Labs', project: 'Landing page performance improvements', unread: 1, status: 'Open' }
];

const threadByDialog: Record<string, { from: 'me' | 'them' | 'system'; text: string; time: string }[]> = {
  d1: [
    { from: 'system', text: 'Invitation accepted. Project moved to In progress.', time: '09:12' },
    { from: 'them', text: 'Please share your first UI iteration before Friday.', time: '09:30' },
    { from: 'me', text: 'Sure, I will upload the clickable prototype and component map.', time: '09:36' }
  ],
  d2: [
    { from: 'them', text: 'Can we align on the revised timeline for QA?', time: '11:10' },
    { from: 'me', text: 'Yes, I can finalize the fixes by Tuesday evening.', time: '11:18' }
  ],
  d3: [
    { from: 'system', text: 'Client invited you to discuss project details.', time: 'Yesterday' },
    { from: 'them', text: 'Do you have examples of similar optimization work?', time: 'Yesterday' }
  ]
};

export default function StudentMessagesPage() {
  const [activeId, setActiveId] = useState(dialogs[0].id);
  const [text, setText] = useState('');
  const [localThread, setLocalThread] = useState(threadByDialog);

  const activeDialog = dialogs.find((d) => d.id === activeId)!;
  const activeThread = useMemo(() => localThread[activeId] || [], [localThread, activeId]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLocalThread((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), { from: 'me', text: trimmed, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
    }));
    setText('');
  }

  return (
    <div className="grid h-[calc(100vh-160px)] min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="card flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500">Project conversations and updates</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {dialogs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${activeId === d.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{d.name}</p>
                {d.unread > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{d.unread}</span>}
              </div>
              <p className="mt-1 text-xs text-slate-600">{d.project}</p>
              <p className="mt-2 text-xs text-slate-500">{d.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="card flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{activeDialog.name}</p>
              <p className="text-sm text-slate-500">{activeDialog.project}</p>
            </div>
            <span className="status-pill bg-emerald-100 text-emerald-700">{activeDialog.status}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5">
          {activeThread.map((msg, idx) => (
            <div key={idx} className={msg.from === 'me' ? 'ml-auto max-w-[80%]' : 'max-w-[80%]'}>
              <div className={`rounded-2xl px-3 py-2 text-sm ${msg.from === 'me' ? 'bg-blue-600 text-white' : msg.from === 'system' ? 'border border-dashed border-slate-300 bg-white text-slate-600' : 'bg-white text-slate-700'}`}>
                {msg.text}
              </div>
              <p className={`mt-1 text-xs text-slate-400 ${msg.from === 'me' ? 'text-right' : ''}`}>{msg.time}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {['Send portfolio link', 'Request clarification', 'Ask about timeline'].map((quick) => (
              <button key={quick} type="button" onClick={() => setText(quick)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {quick}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
            />
            <button type="button" onClick={send} className="btn-primary">Send</button>
          </div>
        </div>
      </section>
    </div>
  );
}
