'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function StudentDashboard() {
  const router = useRouter();
  const [completion, setCompletion] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((mePayload) => {
        const me = mePayload?.data;
        const status = me?.approvalStatus || 'PENDING';
        setApprovalStatus(status);
        setRejectionReason(me?.rejectionReason || '');
        if (status !== 'APPROVED') return null;
        return fetch('/api/student/profile').then((r) => r.json());
      })
      .then((payload) => {
        const profile = payload?.data;
        if (!profile) return;
        const percent = profile?.completeness?.percent || 0;
        const onboardingCompleted = Boolean(profile?.onboardingCompleted);
        setCompletion(percent);
        setMissing(profile?.completeness?.missingFields || []);
        if (!onboardingCompleted || percent < 50) router.replace('/student/onboarding');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="card p-4">Loading dashboard...</div>;

  if (approvalStatus === 'PENDING') {
    return <div className="card p-6"><h1 className="text-2xl font-bold">Account under review</h1><p className="text-slate-600 mt-2">Your account is under review by admin.</p></div>;
  }
  if (approvalStatus === 'REJECTED') {
    return <div className="card p-6"><h1 className="text-2xl font-bold">Account rejected</h1><p className="text-slate-600 mt-2">{rejectionReason || 'Your account was rejected by admin.'}</p></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      {completion < 90 && (
        <div className="card p-4 space-y-2">
          <p className="font-medium">Complete your profile to get better recommendations</p>
          <div className="h-2 bg-slate-200 rounded">
            <div className="h-2 bg-brand rounded" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-sm text-slate-600">{completion}% complete</p>
          {missing.length > 0 && <p className="text-sm text-slate-600">What to improve: {missing.slice(0, 3).join(', ')}</p>}
          <Link href="/student/profile" className="text-brand underline text-sm">Update profile</Link>
        </div>
      )}
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Applications sent" value={14} />
        <Card title="Accepted applications" value={4} />
        <Card title="Average match score" value="82%" />
        <Card title="Profile completion" value={`${completion}%`} />
      </div>
      <div className="card p-4">Recommendation source: fallback demo engine</div>
    </div>
  );
}
