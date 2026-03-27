export function Navbar() {
  const links = [
    ['Home', '/'],
    ['Projects', '/projects'],
    ['About', '/about'],
    ['Sign in', '/signin'],
    ['Sign up', '/signup']
  ] as const;

  return (
    <header className="border-b bg-white">
      <div className="container-app h-16 flex items-center justify-between">
        <a href="/" className="font-bold text-xl">UniWork Diploma</a>
        <nav className="flex gap-2 text-sm">
          {links.map(([title, href]) => (
            <a key={href} href={href} className="px-3 py-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100">
              {title}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
