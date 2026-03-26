'use client';
import { useState } from 'react';

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(formData: FormData) {
    setMessage('');
    setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) {
      setError(payload?.error?.message || 'Failed to create account.');
      return;
    }
    setMessage('Account created successfully. You can sign in now.');
  }

  return <form action={submit} className="card p-6 max-w-lg mx-auto space-y-3"><h1 className="text-2xl font-bold">Sign up</h1><input name="fullName" placeholder="Full name" className="border p-2 rounded w-full" /><input name="email" placeholder="Email" className="border p-2 rounded w-full" /><input name="password" type="password" placeholder="Password (min 8, letters and numbers)" className="border p-2 rounded w-full" /><select name="role" className="border p-2 rounded w-full"><option value="STUDENT">Student</option><option value="CLIENT">Client</option></select><button className="px-4 py-2 bg-brand text-white rounded">Create account</button>{message && <p className="text-sm text-green-700">{message}</p>}{error && <p className="text-sm text-red-700">{error}</p>}</form>;
}
