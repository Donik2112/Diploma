export const dynamic = 'force-static';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-8"><h1 className="text-5xl font-bold mb-4">Development of a Web Platform for Matching Student Freelance Projects</h1><p className="text-slate-600 mb-4">A production-style diploma platform with role-based workflows, ML recommendations, and AI assistant support.</p><div className="flex gap-3"><Link href="/signup" className="px-4 py-2 bg-brand text-white rounded-lg">Sign Up</Link><Link href="/projects" className="px-4 py-2 border rounded-lg">Explore Projects</Link></div></div>
        <div className="card p-8"><h2 className="text-2xl font-semibold mb-3">How it works</h2><ol className="list-decimal ml-6 space-y-2"><li>Students complete profile and get AI-powered recommendations.</li><li>Clients publish projects and review applicants.</li><li>Admin moderates platform and monitors analytics.</li></ol></div>
      </section>
    </div>
  );
}
