import Link from 'next/link';

export function Sidebar({ role }: { role: 'STUDENT' | 'CLIENT' | 'ADMIN' }) {
  const items = role === 'STUDENT'
    ? [['/student/dashboard', 'Dashboard'], ['/student/profile', 'Profile'], ['/student/recommendations', 'Recommendations'], ['/student/applications', 'Applications'], ['/messages', 'Messages']]
    : role === 'CLIENT'
    ? [['/client/dashboard', 'Dashboard'], ['/client/new-project', 'Create Project'], ['/client/projects', 'Manage Projects'], ['/messages', 'Messages']]
    : [['/admin/dashboard', 'Admin Dashboard'], ['/admin/users', 'Users'], ['/admin/projects', 'Projects'], ['/admin/analytics', 'Analytics']];

  return (
    <aside className="min-h-screen w-64 border-r bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-slate-500">{role} PANEL</p>
      <div className="space-y-1">
        {items.map(([href, label]) => (
          <Link key={href} href={href} className="block rounded px-3 py-2 text-sm hover:bg-slate-100">{label}</Link>
        ))}
      </div>
    </aside>
  );
}
