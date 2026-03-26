import { PrismaClient, Role, ProjectStatus, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const skillsPool = ['React', 'TypeScript', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'Figma', 'UI/UX', 'Data Analysis', 'Machine Learning', 'Docker', 'Next.js'];
const categories = ['Web Development', 'Data Science', 'Mobile App', 'UI/UX Design', 'AI Assistant'];
const cities = ['New York', 'Boston', 'San Francisco', 'Chicago', 'Austin', 'Remote'];

async function main() {
  await prisma.moderationLog.deleteMany();
  await prisma.assistantLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.recommendationLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.favoriteProject.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  const pass = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({ data: { role: Role.ADMIN, fullName: 'Olivia Brown', email: 'admin@platform.com', passwordHash: pass, city: 'New York', university: 'MIT' } });

  const students = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        role: Role.STUDENT,
        fullName: `Student ${i}`,
        email: `student${i}@platform.com`,
        passwordHash: pass,
        university: 'State Technical University',
        city: cities[i % cities.length],
        bio: 'Motivated student freelancer specializing in digital product delivery.',
        rating: 3.8 + (i % 2) * 0.6
      }
    });
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        skills: [skillsPool[i % skillsPool.length], skillsPool[(i + 2) % skillsPool.length], skillsPool[(i + 4) % skillsPool.length]],
        experienceLevel: i % 3 === 0 ? 'Intermediate' : 'Junior',
        portfolioLinks: ['https://portfolio.example.com'],
        certificates: ['Google Data Analytics', 'AWS Cloud Practitioner'],
        interests: ['Web Development', 'AI'],
        githubUrl: 'https://github.com/demo',
        linkedinUrl: 'https://linkedin.com/in/demo',
        resumeText: 'Hands-on project experience in academic and freelance settings.',
        about: 'Open to part-time or project-based collaboration.',
        availabilityStatus: i % 2 === 0 ? 'PART_TIME' : 'AVAILABLE'
      }
    });
    students.push(user);
  }

  const clients = [];
  for (let i = 1; i <= 6; i++) {
    const client = await prisma.user.create({
      data: {
        role: Role.CLIENT,
        fullName: `Client ${i}`,
        email: `client${i}@platform.com`,
        passwordHash: pass,
        city: cities[i % cities.length],
        bio: 'Startup client looking for agile student talent.',
        rating: 4.2
      }
    });
    await prisma.clientProfile.create({
      data: {
        userId: client.id,
        companyName: `Innovate Labs ${i}`,
        companyDescription: 'Product studio building web and AI solutions.',
        website: 'https://example-company.com',
        industry: i % 2 === 0 ? 'FinTech' : 'EdTech'
      }
    });
    clients.push(client);
  }

  const projects = [];
  for (let i = 1; i <= 24; i++) {
    const project = await prisma.project.create({
      data: {
        clientId: clients[i % clients.length].id,
        title: `Project ${i}: ${categories[i % categories.length]} Solution`,
        description: `Professional project ${i} focused on scalable architecture, dashboarding, and measurable delivery outcomes.`,
        category: categories[i % categories.length],
        requiredSkills: [skillsPool[i % skillsPool.length], skillsPool[(i + 3) % skillsPool.length], 'Communication'],
        budgetMin: 400 + i * 40,
        budgetMax: 1200 + i * 75,
        deadline: new Date(Date.now() + i * 86400000 * 3),
        city: cities[i % cities.length],
        employmentType: i % 2 === 0 ? 'Remote' : 'Hybrid',
        experienceLevel: i % 3 === 0 ? 'Intermediate' : 'Junior',
        status: i % 10 === 0 ? ProjectStatus.IN_PROGRESS : ProjectStatus.OPEN
      }
    });
    projects.push(project);
  }

  for (let i = 0; i < 22; i++) {
    await prisma.application.create({
      data: {
        projectId: projects[i].id,
        studentId: students[i % students.length].id,
        coverLetter: 'I can deliver this project with strong communication and milestone-based planning.',
        proposedPrice: 500 + i * 35,
        estimatedDuration: `${2 + (i % 5)} weeks`,
        status: i % 7 === 0 ? ApplicationStatus.ACCEPTED : ApplicationStatus.SENT
      }
    });
  }

  for (let i = 0; i < 12; i++) {
    await prisma.review.create({
      data: {
        projectId: projects[i].id,
        fromUserId: clients[i % clients.length].id,
        toUserId: students[i % students.length].id,
        rating: 4 + (i % 2),
        text: 'Professional execution, good communication, and timely progress updates.'
      }
    });
  }

  for (let i = 0; i < 20; i++) {
    await prisma.message.create({
      data: {
        projectId: projects[i].id,
        senderId: i % 2 === 0 ? clients[i % clients.length].id : students[i % students.length].id,
        receiverId: i % 2 === 0 ? students[i % students.length].id : clients[i % clients.length].id,
        text: 'Thank you for your update. Let us confirm the next milestone tomorrow.'
      }
    });
  }

  console.log('Seed complete', { admin: admin.email, students: students.length, clients: clients.length, projects: projects.length });
}

main().finally(() => prisma.$disconnect());
