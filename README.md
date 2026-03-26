# Development of a Web Platform for Matching Student Freelance Projects Using Machine Learning and an AI Assistant

## Project Overview
UniWork Diploma is a full-stack multi-role platform for matching students with freelance projects. It includes student, client, and admin workflows, recommendation integration, assistant module, analytics dashboards, and MongoDB-backed APIs.

## Features
- Public pages: Home, About, Projects catalog, Project details
- Auth: Sign up / Sign in with role selection
- Student area: dashboard, profile editor, recommendations, applications, messaging
- Client area: dashboard, create project, manage projects, applicants
- Admin area: dashboard, users, projects moderation, analytics
- Recommendation API with external ML service + fallback engine
- AI Assistant widget with `/api/assistant`
- Role-based route protection via middleware

## Tech Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT authentication
- Zod validation
- Recharts analytics
- Lucide-react icons

## Architecture Overview
- `app/` UI routes and API routes
- `components/` reusable UI and dashboard widgets
- `lib/` db connection, auth, recommendation, assistant services
- `models/` domain entities (User, Project, Application, etc.)
- `prisma/seed.ts` seed script for demo data
- `types/` shared TS types

## Environment Variables
Copy `.env.example` to `.env` and set:
- `MONGODB_URI`
- `JWT_SECRET`
- `PYTHON_RECOMMENDER_URL` (optional)
- `NEXT_PUBLIC_APP_URL`

## Setup Instructions
```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

## Run Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run seed`

## Database Setup
The app uses MongoDB Atlas. Default sample URI is prefilled in `.env.example` for local demo.

## API Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `GET /api/applications`
- `POST /api/applications`
- `POST /api/recommend`
- `POST /api/assistant`
- `GET /api/admin/stats`

## Recommendation API Integration
`/api/recommend` behavior:
1. If `PYTHON_RECOMMENDER_URL` exists and responds -> source is `ML API`.
2. Otherwise -> internal fallback similarity engine ranks projects.

Dev UI label displays recommendation source.

## Demo Credentials
All demo users use password: `password123`
- Admin: `admin@uniwork.demo`
- Student: `student1@uniwork.demo`
- Client: `client1@uniwork.demo`

## Future Improvements
- Replace JWT cookie auth with NextAuth session management
- Add full CRUD for profile/project/applications from dashboards
- Add websocket real-time chat
- Add moderation logs, notifications, favorites, and payment gateway integration
- Add production-grade tests and CI/CD pipeline
