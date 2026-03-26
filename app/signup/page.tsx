'use client';
import { useEffect, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';
import Link from 'next/link';
import Script from 'next/script';

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'role' | 'university' | 'captchaToken', string>>;

export default function SignUpPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setCaptchaToken(token);
      setFieldErrors((prev) => ({ ...prev, captchaToken: undefined }));
    };
    (window as any).onTurnstileExpired = () => {
      setCaptchaToken('');
    };

    return () => {
      delete (window as any).onTurnstileSuccess;
      delete (window as any).onTurnstileExpired;
    };
  }, []);

  async function submit(formData: FormData) {
    setMessage('');
    setError('');
    setFieldErrors({});

    if (!captchaToken) {
      setFieldErrors({ captchaToken: 'Please complete the CAPTCHA' });
      return;
    }

    try {
      const values = Object.fromEntries(formData.entries());
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, captchaToken })
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

      setCaptchaToken('');
      setMessage(payload?.data?.message || 'Please verify your email address before signing in');
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

      {turnstileSiteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
            data-expired-callback="onTurnstileExpired"
          />
        </>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            onChange={(e) => setCaptchaToken(e.target.checked ? 'dev-captcha-pass' : '')}
          />
          I am not a robot (development CAPTCHA)
        </label>
      )}
      {fieldErrors.captchaToken && <p className="text-sm text-red-700">{fieldErrors.captchaToken}</p>}

      <button className="px-4 py-2 bg-brand text-white rounded">Create account</button>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <p className="text-sm text-slate-600">
        Already have an account? <Link href="/signin" className="text-brand underline">Sign in</Link>
      </p>
    </form>
  );
}
