'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'STUDENT' | 'CLIENT' | 'ADMIN';

type AuthMe = {
  userId: string;
  role: Role;
};

export function Navbar() {
  const [authUser, setAuthUser] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) {
          setAuthUser(null);
          return;
        }
        const payload = await res.json();
        setAuthUser(payload?.data || null);
      } catch {
        if (mounted) setAuthUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const roleLinks = useMemo(() => {
    if (!authUser) return [];
    if (authUser.role === 'STUDENT') {
      return [
        ['Dashboard', '/student/dashboard'],
        ['Profile', '/student/profile'],
        ['Applications', '/student/applications'],
        ['Messages', '/student/messages']
      ] as const;
    }
    if (authUser.role === 'CLIENT') {
      return [
        ['Dashboard', '/client/dashboard'],
        ['My Projects', '/client/projects'],
        ['Applicants', '/client/applicants']
      ] as const;
    }
    return [
      ['Admin', '/admin/dashboard'],
      ['Analytics', '/admin/analytics'],
      ['Users', '/admin/users'],
      ['Projects', '/admin/projects']
    ] as const;
  }, [authUser]);

  async function logout() {
    setLogoutBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      router.push('/');
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container-app h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-sm">
              U
            </span>
            <div>
              <p className="text-sm text-slate-500 leading-tight">Marketplace</p>
              <p className="font-semibold text-slate-900 leading-tight">UniWork</p>
            </div>
          </Link>
          <span className="hidden lg:inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Verified students
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-2">
          {[
            ['Home', '/'],
            ['Projects', '/projects'],
            ['About', '/about']
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
              {label}
            </Link>
          ))}

          {roleLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && !authUser && (
            <>
              <Link href="/signin" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                Sign in
              </Link>
              <Link href="/signin?tab=signup" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition">
                Get started
              </Link>
            </>
          )}

          {!loading && authUser && (
            <>
              <Link
                href={authUser.role === 'STUDENT' ? '/student/dashboard' : authUser.role === 'CLIENT' ? '/client/dashboard' : '/admin/dashboard'}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={logoutBusy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
              >
                {logoutBusy ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
