export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">About the Platform</h1>
      <p className="mt-4 text-slate-700">This platform helps students find freelance projects that match their skills, interests, and experience while helping clients access validated junior talent.</p>
      <h2 className="mt-6 text-xl font-semibold">Recommendation Logic</h2>
      <p className="mt-2 text-slate-700">The recommendation module compares profile skills, experience level, city preference, and interests with active projects. It supports integration with a Python ML service and includes a fallback engine for demo reliability.</p>
    </main>
  );
}
