'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [emailForResend, setEmailForResend] = useState('');
  const router = useRouter();

  async function submit(formData: FormData) {
    setError('');
    setInfo('');
    setNeedsVerification(false);

    const email = String(formData.get('email') || '');
    setEmailForResend(email);

    const res = await fetch('/api/auth/signin', {
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
      const message = typeof payload?.error === 'string' ? payload.error : payload?.error?.message;
      setError(message || 'Invalid credentials');
      setNeedsVerification(Boolean(payload?.needsVerification));
      return;
    }

    const role = payload.data.role;
    router.push(role === 'ADMIN' ? '/admin/dashboard' : role === 'CLIENT' ? '/client/dashboard' : '/student/dashboard');
  }

  async function resendVerificationEmail() {
    if (!emailForResend) {
      setError('Enter your email');
      return;
    }

    setInfo('');
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailForResend })
    });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      setError(payload?.error || 'Could not resend verification email. Please try again later');
      return;
    }

    setInfo(payload?.data?.message || 'Verification email sent.');
  }

  return (
    <form action={submit} className="card p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <input name="email" className="border p-2 rounded w-full" placeholder="Email" />
      <input name="password" type="password" className="border p-2 rounded w-full" placeholder="Password" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {info && <p className="text-green-700 text-sm">{info}</p>}
      {needsVerification && (
        <button
          type="button"
          onClick={resendVerificationEmail}
          className="px-3 py-1 border rounded text-sm"
        >
          Resend verification email
        </button>
      )}
      <button className="px-4 py-2 bg-brand text-white rounded">Sign in</button>
    </form>
  );
}
