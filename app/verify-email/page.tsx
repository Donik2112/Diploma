import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Verifying your email...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
