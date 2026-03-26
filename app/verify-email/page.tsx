'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const [message, setMessage] = useState('Verifying your email...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setMessage('This verification link is invalid or has expired');
        return;
      }

      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const payload = await res.json();
      if (res.ok && payload?.success) {
        setSuccess(true);
        setMessage(payload?.data?.message || 'Your email has been verified successfully');
      } else {
        setMessage(payload?.error || 'This verification link is invalid or has expired');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="card p-6 max-w-lg mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Email verification</h1>
      <p className={success ? 'text-green-700' : 'text-red-700'}>{message}</p>
      <Link href="/signin" className="text-brand underline">Go to sign in</Link>
    </div>
  );
}
