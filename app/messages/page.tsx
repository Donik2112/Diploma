import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="mx-auto max-w-3xl p-8"><p>Please sign in to view messages.</p></main>;
  const messages = await prisma.message.findMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] }, include: { sender: true, receiver: true, project: true }, orderBy: { createdAt: 'desc' }, take: 40 });
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">Project Messaging</h1>
      <div className="mt-4 space-y-2">{messages.map((m) => <div key={m.id} className={`rounded-xl p-3 ${m.senderId===user.id ? 'bg-blue-100' : 'bg-white border'}`}><p className="text-xs text-slate-500">{m.project.title} • {m.sender.fullName} → {m.receiver.fullName}</p><p>{m.text}</p></div>)}</div>
    </main>
  );
}
