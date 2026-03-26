'use client';
import { useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'role' | 'university', string>>;

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function submit(formData: FormData) {
    setMessage('');
    setError('');
    setFieldErrors({});

    try {
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

        if (backendField && backendMessage) {
          setFieldErrors({ [backendField]: backendMessage } as FieldErrors);
        } else {
          setError(backendMessage || fallback);
        }
        return;
      }

      setMessage('Account created successfully. You can sign in now.');
    } catch {
      setError('Could not create the account. Please try again later');
    }
  }

  return (
    <form action={submit} className="card p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Sign up</h1>

      <input name="firstName" placeholder="First name" className="border p-2 rounded w-full" />
      {fieldErrors.firstName && <p className="text-sm text-red-700">{fieldErrors.firstName}</p>}

      <input name="lastName" placeholder="Last name" className="border p-2 rounded w-full" />
      {fieldErrors.lastName && <p className="text-sm text-red-700">{fieldErrors.lastName}</p>}

      <select name="university" className="border p-2 rounded w-full" defaultValue="">
        <option value="" disabled>Select your university</option>
        {KAZAKHSTAN_UNIVERSITIES.map((university) => (
          <option key={university} value={university}>{university}</option>
        ))}
      </select>
      {fieldErrors.university && <p className="text-sm text-red-700">{fieldErrors.university}</p>}

      <input name="email" placeholder="Email" className="border p-2 rounded w-full" />
      {fieldErrors.email && <p className="text-sm text-red-700">{fieldErrors.email}</p>}

      <input name="password" type="password" placeholder="Password (min 8, letters and numbers)" className="border p-2 rounded w-full" />
      {fieldErrors.password && <p className="text-sm text-red-700">{fieldErrors.password}</p>}

      <select name="role" className="border p-2 rounded w-full" defaultValue="">
        <option value="" disabled>Select role</option>
        <option value="STUDENT">Student</option>
        <option value="CLIENT">Client</option>
      </select>
      {fieldErrors.role && <p className="text-sm text-red-700">{fieldErrors.role}</p>}

      <button className="px-4 py-2 bg-brand text-white rounded">Create account</button>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
