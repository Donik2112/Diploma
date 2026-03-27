'use client';

import { useEffect, useState } from 'react';

type MeResponse = {
  success?: boolean;
  data?: {
    emailVerified?: boolean;
  };
};

export function EmailVerificationBanner() {
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) {
          if (active) setShowBanner(false);
          return;
        }

        const payload: MeResponse = await response.json();
        if (active) {
          setShowBanner(payload?.data?.emailVerified === false);
        }
      } catch {
        if (active) setShowBanner(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  async function resendVerificationEmail() {
    setMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setMessage(payload?.error || 'Could not resend verification email. Please try again later');
        return;
      }

      setMessage('Verification email sent');
    } catch {
      setMessage('Could not resend verification email. Please try again later');
    } finally {
      setIsSending(false);
    }
  }

  if (loading || !showBanner) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm text-amber-800">Your email is not verified. Please verify your email.</p>
      <button
        type="button"
        onClick={resendVerificationEmail}
        disabled={isSending}
        className="mt-3 rounded border border-amber-700 px-3 py-1 text-sm text-amber-900 disabled:opacity-60"
      >
        {isSending ? 'Sending...' : 'Resend verification email'}
      </button>
      {message && <p className="mt-2 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
