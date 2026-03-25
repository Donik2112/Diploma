'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  const submit = async (formData: FormData) => {
    const email = formData.get('email');
    const password = formData.get('password');
    const res = await fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return setError('Invalid credentials');
    const data = await res.json();
    router.push(data.role === 'STUDENT' ? '/student/dashboard' : data.role === 'CLIENT' ? '/client/dashboard' : '/admin/dashboard');
  };
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold">Sign In</h1>
      <form action={submit} className="mt-6 space-y-3 rounded-xl border bg-white p-6">
        <input required name="email" placeholder="Email" className="w-full rounded border px-3 py-2" />
        <input required name="password" type="password" placeholder="Password" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-brand-600 py-2 text-white">Sign In</button>
      </form>
    </main>
  );
}
