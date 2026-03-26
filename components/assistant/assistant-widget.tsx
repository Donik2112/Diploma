'use client';
import { useState } from 'react';

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');

  const ask = async (question: string) => {
    const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: question }) });
    const data = await res.json();
    setReply(data.reply);
  };

  return <div className="fixed bottom-5 right-5 z-50">{open && <div className="card p-4 w-80 mb-2"><h3 className="font-semibold mb-2">AI Assistant</h3><div className="flex flex-wrap gap-2 mb-2 text-xs">{['Help me complete my profile','Suggest skills for my target role','Help me write a project description','Explain why this project matches me'].map(x => <button key={x} onClick={() => ask(x)} className="px-2 py-1 border rounded">{x}</button>)}</div><textarea className="w-full border rounded p-2 text-sm" placeholder="Ask your question" value={prompt} onChange={(e)=>setPrompt(e.target.value)} /><button onClick={()=>ask(prompt)} className="mt-2 px-3 py-1 bg-brand text-white rounded">Send</button>{reply && <p className="text-sm mt-2">{reply}</p>}</div>}<button onClick={() => setOpen(!open)} className="bg-brand text-white rounded-full px-4 py-3">AI Assistant</button></div>;
}
