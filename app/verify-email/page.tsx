import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

type VerifyEmailPageProps = {
  searchParams: {
    token?: string | string[];
  };
};

function getToken(searchParams: VerifyEmailPageProps['searchParams']) {
  const rawToken = searchParams?.token;

  if (Array.isArray(rawToken)) {
    return rawToken[0] ?? '';
  }

  return rawToken ?? '';
}

async function verifyToken(token: string) {
  if (!token) {
    return false;
  }

  try {
    const requestHeaders = headers();
    const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
    const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';

    if (!host) {
      return false;
    }

    const response = await fetch(
      `${protocol}://${host}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = getToken(searchParams);
  const success = await verifyToken(token);

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm space-y-4">
      <h1 className="text-2xl font-bold">Verify email</h1>
      {success ? (
        <>
          <p className="text-green-700">Email verified successfully. You can now sign in.</p>
          <Link href="/signin" className="px-3 py-1 border rounded text-sm inline-block">
            Go to sign in
          </Link>
        </>
      ) : (
        <p className="text-red-600">Invalid or expired verification link</p>
      )}
    </div>
  );
}
