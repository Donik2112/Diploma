'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('This verification link is invalid or has expired');
        return;
      }

      try {
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
        const text = await res.text();

        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || 'Verification failed');
        }

        if (!res.ok) {
          throw new Error(data?.error || 'Verification failed');
        }

        setMessage(data?.data?.message || data?.message || 'Your email has been verified successfully');
      } catch (err: any) {
        setError(err?.message || 'This verification link is invalid or has expired');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold">Verify email</h1>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <p className="text-slate-700">{message}</p>
      )}
    </div>
  );
}
