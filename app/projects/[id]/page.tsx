import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export default async function ProjectDetails({ params }: { params: { id: string } }) {
  await connectDB();
  const project: any = await Project.findById(params.id).lean();
  if (!project) return <div className="card p-6">Project not found.</div>;
  return <div className="card p-6 space-y-3"><h1 className="text-3xl font-bold">{project.title}</h1><p>{project.description}</p><p><b>Skills:</b> {(project.requiredSkills || []).join(', ')}</p><p><b>Budget:</b> ${project.budgetMin} - ${project.budgetMax}</p><p><b>Deadline:</b> {new Date(project.deadline).toLocaleDateString()}</p><button className="px-4 py-2 bg-brand text-white rounded-lg w-fit">Apply to project</button></div>;
}
