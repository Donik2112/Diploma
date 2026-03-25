# Development of a Web Platform for Matching Student Freelance Projects Using Machine Learning and an AI Assistant

## 1) Project Overview
This diploma project is a full-stack web platform that matches students to freelance projects using profile data, project requirements, recommendation logic, and an AI assistant module.

## 2) Features
- Multi-role system: **Student**, **Client**, **Admin**.
- Public pages: home, about, projects catalog, project details.
- Auth: sign up/sign in with role-aware redirects.
- Student area: dashboard, profile editing, recommendations, applications.
- Client area: dashboard, project creation, project management, applicants view.
- Admin area: dashboard, user/project moderation, analytics.
- Messaging module and review-ready data model.
- Recommendation API with Python ML integration + fallback engine.
- AI Assistant floating widget + `/api/assistant` backend provider pattern.
- Prisma/PostgreSQL data model with seed dataset for demonstration.

## 3) Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- JWT cookie authentication
- React Hook Form / Zod ready integration pattern
- Recharts for analytics
- Lucide-react compatible architecture

## 4) Architecture Overview
```
app/                 # UI pages + API routes
components/          # reusable UI, layout, assistant, charts
lib/                 # auth, prisma client, recommendation, assistant logic
prisma/              # schema and seed scripts
hooks/               # reserved for client hooks
types/               # reserved for shared TS types
```
Separation of concerns:
- UI rendering: `app/`, `components/`
- Business logic and integrations: `lib/recommendation.ts`, `lib/assistant.ts`
- DB access: Prisma models + `lib/prisma.ts`
- Auth and authorization: `lib/auth.ts` + role checks in layouts and APIs

## 5) Setup Instructions
1. Install dependencies:
```bash
npm install
```
2. Configure environment:
```bash
cp .env.example .env
```
3. Set your PostgreSQL connection in `.env` (`DATABASE_URL`).
4. Run Prisma migration:
```bash
npm run prisma:migrate -- --name init
```
5. Generate Prisma client:
```bash
npm run prisma:generate
```
6. Seed demo data:
```bash
npm run seed
```
7. Run development server:
```bash
npm run dev
```

## 6) Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: JWT signing key.
- `PYTHON_RECOMMENDER_URL`: Optional Python recommender base URL. If empty, fallback engine is used.
- `NEXT_PUBLIC_APP_NAME`: Public app name.

## 7) Database Setup
Prisma schema includes all core diploma entities:
`User`, `StudentProfile`, `ClientProfile`, `Project`, `Application`, `Review`, `Message`, `Payment`, `RecommendationLog`.
Also includes optional entities: `Notification`, `FavoriteProject`, `AssistantLog`, `ModerationLog`.

## 8) Seed Command
```bash
npm run seed
```
Seed creates:
- 17 users (10 students, 6 clients, 1 admin)
- 24 projects
- 22 applications
- 12 reviews
- 20 messages

## 9) Run Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:migrate`
- `npm run prisma:generate`
- `npm run seed`

## 10) Recommendation API Integration
### Endpoint
`POST /api/recommend`

### Input
```json
{
  "skills": ["React", "TypeScript"],
  "experience": "Junior",
  "city": "Boston",
  "interests": ["Web Development"],
  "top_n": 10,
  "strict_city": false
}
```

### Output
Ranked recommendations with:
- project metadata
- `score`
- `scorePercent`
- explanation
- source label (`ML API` or `fallback demo engine`)

### Behavior
- If `PYTHON_RECOMMENDER_URL` exists, calls external recommender.
- If unavailable or fails, uses internal fallback similarity engine.
- Logs recommendations to `RecommendationLog` for student users.

## 11) API Documentation (minimum required)
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `POST /api/auth/signout`
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `GET /api/applications`
- `POST /api/applications`
- `POST /api/recommend`
- `POST /api/assistant`
- `GET /api/admin/stats`

## 12) Demo Credentials
Password for all demo users: `Password123!`
- Admin: `admin@platform.com`
- Student: `student1@platform.com`
- Client: `client1@platform.com`

## 13) Future Improvements
- Integrate NextAuth with provider ecosystem.
- Add full chat rooms with live updates (WebSocket).
- Add file uploads for resumes/portfolio assets.
- Add advanced ML model (embeddings + feedback loop).
- Add notifications center with read/unread actions.
- Add moderation actions with dedicated admin workflows.
