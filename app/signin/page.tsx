'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  async function submit(formData: FormData) {
    const res = await fetch('/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    if (!res.ok) return setError('Invalid credentials');
    const data = await res.json();
    router.push(data.role === 'ADMIN' ? '/admin/dashboard' : data.role === 'CLIENT' ? '/client/dashboard' : '/student/dashboard');
  }
  return <form action={submit} className="card p-6 max-w-md mx-auto space-y-3"><h1 className="text-2xl font-bold">Sign in</h1><input name="email" className="border p-2 rounded w-full" placeholder="Email" /><input name="password" type="password" className="border p-2 rounded w-full" placeholder="Password" />{error && <p className="text-red-600 text-sm">{error}</p>}<button className="px-4 py-2 bg-brand text-white rounded">Sign in</button></form>;
}
