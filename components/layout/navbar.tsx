import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-brand-600">Student Freelance Match</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/about">About</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/signin">Sign In</Link>
          <Link href="/signup" className="rounded bg-brand-600 px-3 py-1 text-white">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
}
