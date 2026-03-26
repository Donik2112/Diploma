import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Application from '@/models/Application';

export async function GET() {
  await connectDB();
  const [totalUsers, totalStudents, totalClients, totalProjects, totalApplications] = await Promise.all([
    User.countDocuments({}), User.countDocuments({ role: 'STUDENT' }), User.countDocuments({ role: 'CLIENT' }), Project.countDocuments({}), Application.countDocuments({})
  ]);
  return NextResponse.json({ totalUsers, totalStudents, totalClients, totalProjects, totalApplications, flaggedItems: 0 });
}
