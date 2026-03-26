'use client';
import { useState } from 'react';

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(formData: FormData) {
    setMessage('');
    setError('');
    setFieldErrors({});

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok || !payload?.success) {
      const backendMessage = typeof payload?.error === 'string' ? payload.error : '';
      const backendField = typeof payload?.field === 'string' ? payload.field : '';
      const fallback = 'Could not create the account. Please try again later';
      const finalMessage = backendMessage || fallback;

      setError(finalMessage);
      if (backendField && backendMessage) {
        setFieldErrors({ [backendField]: backendMessage });
      }
      return;
    }

    setMessage('Account created successfully. You can sign in now.');
  }

  return <form action={submit} className="card p-6 max-w-lg mx-auto space-y-3"><h1 className="text-2xl font-bold">Sign up</h1><input name="fullName" placeholder="Full name" className="border p-2 rounded w-full" />{fieldErrors.fullName && <p className="text-sm text-red-700">{fieldErrors.fullName}</p>}<input name="email" placeholder="Email" className="border p-2 rounded w-full" />{fieldErrors.email && <p className="text-sm text-red-700">{fieldErrors.email}</p>}<input name="password" type="password" placeholder="Password (min 8, letters and numbers)" className="border p-2 rounded w-full" />{fieldErrors.password && <p className="text-sm text-red-700">{fieldErrors.password}</p>}<select name="role" className="border p-2 rounded w-full"><option value="STUDENT">Student</option><option value="CLIENT">Client</option></select>{fieldErrors.role && <p className="text-sm text-red-700">{fieldErrors.role}</p>}<button className="px-4 py-2 bg-brand text-white rounded">Create account</button>{message && <p className="text-sm text-green-700">{message}</p>}{error && <p className="text-sm text-red-700">{error}</p>}</form>;
}
