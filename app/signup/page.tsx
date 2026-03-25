'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const submit = async (formData: FormData) => {
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return setError('Failed to create account');
    router.push('/signin');
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-3xl font-bold">Create Account</h1>
      <form action={submit} className="mt-6 space-y-3 rounded-xl border bg-white p-6">
        <input required name="fullName" placeholder="Full name" className="w-full rounded border px-3 py-2" />
        <input required name="email" type="email" placeholder="Email" className="w-full rounded border px-3 py-2" />
        <input required name="password" type="password" placeholder="Password" className="w-full rounded border px-3 py-2" />
        <select required name="role" className="w-full rounded border px-3 py-2"><option value="STUDENT">Student</option><option value="CLIENT">Client</option></select>
        <input name="city" placeholder="City" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-brand-600 py-2 text-white">Create Account</button>
      </form>
    </main>
  );
}
