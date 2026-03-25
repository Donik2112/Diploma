import { prisma } from '@/lib/prisma';

export default async function ApplicantsPage({ params }: { params: { id: string } }) {
  const apps = await prisma.application.findMany({ where: { projectId: params.id }, include: { student: { include: { studentProfile: true } } } });
  return (
    <div>
      <h1 className="text-3xl font-bold">Project Applicants</h1>
      <div className="mt-4 space-y-3">{apps.map((a, idx) => <div className="card" key={a.id}><p className="font-semibold">{a.student.fullName} {idx===0 && <span className="rounded bg-green-100 px-2 text-xs text-green-700">Recommended candidate</span>}</p><p className="text-sm">Cover letter: {a.coverLetter}</p><p className="text-sm">Proposed price: ${a.proposedPrice} • Duration: {a.estimatedDuration}</p></div>)}</div>
    </div>
  );
}
