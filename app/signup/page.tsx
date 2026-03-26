'use client';
import { useState } from 'react';

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  async function submit(formData: FormData) {
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    setMessage(res.ok ? 'Account created successfully.' : 'Failed to create account.');
  }
  return <form action={submit} className="card p-6 max-w-lg mx-auto space-y-3"><h1 className="text-2xl font-bold">Sign up</h1><input name="fullName" placeholder="Full name" className="border p-2 rounded w-full" /><input name="email" placeholder="Email" className="border p-2 rounded w-full" /><input name="password" type="password" placeholder="Password" className="border p-2 rounded w-full" /><select name="role" className="border p-2 rounded w-full"><option value="STUDENT">Student</option><option value="CLIENT">Client</option></select><button className="px-4 py-2 bg-brand text-white rounded">Create account</button>{message && <p className="text-sm">{message}</p>}</form>;
}
