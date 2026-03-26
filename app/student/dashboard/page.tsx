import { Card } from '@/components/ui/card';
export default function StudentDashboard() {
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Student Dashboard</h1><div className="grid md:grid-cols-4 gap-4"><Card title="Applications sent" value={14} /><Card title="Accepted applications" value={4} /><Card title="Average match score" value="82%" /><Card title="Profile completion" value="88%" /></div><div className="card p-4">Recommendation source: fallback demo engine</div></div>;
}
