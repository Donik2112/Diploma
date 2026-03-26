import { Card } from '@/components/ui/card';
export default function ClientDashboard() {
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Client Dashboard</h1><div className="grid md:grid-cols-4 gap-4"><Card title="Active projects" value={6} /><Card title="Received applications" value={29} /><Card title="Completed projects" value={18} /><Card title="Average student rating" value="4.7" /></div></div>;
}
