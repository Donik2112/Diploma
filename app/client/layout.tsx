import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'CLIENT') redirect('/signin');
  return <div className="flex"><Sidebar role="CLIENT" /><main className="flex-1 p-6">{children}</main></div>;
}
