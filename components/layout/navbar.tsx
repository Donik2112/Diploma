import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="container-app h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">UniWork Diploma</Link>
        <nav className="flex gap-2 text-sm">
          {[
            ['Home', '/'], ['Projects', '/projects'], ['About', '/about'],
            ['Sign in', '/signin'], ['Sign up', '/signup'],
            ['Student', '/student/dashboard'], ['Client', '/client/dashboard'], ['Admin', '/admin/dashboard']
          ].map(([t, h]) => <Link key={h} href={h} className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100">{t}</Link>)}
        </nav>
      </div>
    </header>
  );
}
