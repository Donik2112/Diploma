import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="grid gap-8 rounded-2xl bg-white p-10 shadow-sm md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold">Development of a Web Platform for Matching Student Freelance Projects Using Machine Learning and an AI Assistant</h1>
          <p className="mt-4 text-slate-600">A production-style diploma web platform with role-based workflows, recommendation logic, and analytics dashboards.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/signup" className="rounded bg-brand-600 px-4 py-2 text-white">Sign Up</Link>
            <Link href="/projects" className="rounded border px-4 py-2">Explore Projects</Link>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Students complete profiles and receive ranked project recommendations.</li>
            <li>Clients publish projects and manage applicants.</li>
            <li>Admins monitor platform analytics and moderation.</li>
          </ul>
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {['ML-powered matching', 'Project-based messaging', 'Role dashboards', 'Platform analytics'].map((t) => <div key={t} className="card"><p className="font-semibold">{t}</p></div>)}
      </section>
    </main>
  );
}
