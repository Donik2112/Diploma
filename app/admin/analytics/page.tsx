import { prisma } from '@/lib/prisma';
import { AdminCharts } from '@/components/charts/admin-charts';

export default async function AdminAnalyticsPage() {
  const users = await prisma.user.groupBy({ by: ['role'], _count: { role: true } });
  const projects = await prisma.project.groupBy({ by: ['category'], _count: { category: true } });
  const apps = await prisma.application.findMany({ select: { createdAt: true } });
  const timelineMap: Record<string, number> = {};
  apps.forEach((a) => { const d = a.createdAt.toISOString().slice(0, 10); timelineMap[d] = (timelineMap[d] || 0) + 1; });
  const data = {
    usersByRole: users.map((u) => ({ name: u.role, value: u._count.role })),
    projectsByCategory: projects.map((p) => ({ name: p.category, value: p._count.category })),
    applicationsOverTime: Object.entries(timelineMap).map(([name, value]) => ({ name, value }))
  };
  return <div><h1 className="mb-4 text-3xl font-bold">Platform Analytics</h1><AdminCharts data={data} /></div>;
}
