'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export function AdminCharts({ data }: { data: any }) {
  const colors = ['#2563eb', '#60a5fa', '#0ea5e9', '#93c5fd'];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card h-72"><p className="mb-2 font-semibold">Users by Role</p><ResponsiveContainer width="100%" height="85%"><PieChart><Pie data={data.usersByRole} dataKey="value" nameKey="name">{data.usersByRole.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie></PieChart></ResponsiveContainer></div>
      <div className="card h-72"><p className="mb-2 font-semibold">Projects by Category</p><ResponsiveContainer width="100%" height="85%"><BarChart data={data.projectsByCategory}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
      <div className="card h-72 md:col-span-2"><p className="mb-2 font-semibold">Applications Over Time</p><ResponsiveContainer width="100%" height="85%"><LineChart data={data.applicationsOverTime}><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="value" stroke="#2563eb" /></LineChart></ResponsiveContainer></div>
    </div>
  );
}
