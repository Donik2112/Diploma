'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setSuccess(Boolean(res.ok && data?.success));
      } catch {
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  if (loading) {
    return <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">Verifying your email...</div>;
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm space-y-4">
      <h1 className="text-2xl font-bold">Verify email</h1>
      {success ? (
        <>
          <p className="text-green-700">Email verified successfully. You can now sign in.</p>
          <Link href="/signin" className="px-3 py-1 border rounded text-sm inline-block">Go to sign in</Link>
        </>
      ) : (
        <p className="text-red-600">Invalid or expired verification link</p>
      )}
    </div>
  );
}
