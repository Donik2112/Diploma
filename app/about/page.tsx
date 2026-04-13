export default function AboutPage() {
  return <div className="card p-8 space-y-4"><h1 className="text-3xl font-bold">About the Platform</h1><p>This diploma project solves student-client matching by combining profile data, skills, project attributes, and recommendation scoring.</p><p>The recommendation module first tries a Python ML service and then falls back to an internal demo ranking engine for reliability.</p></div>;
}
