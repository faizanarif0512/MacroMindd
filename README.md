# MacroMind

MacroMind is a full-stack AI-powered nutrition tracker built with Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI primitives, Prisma, PostgreSQL, Clerk, USDA FoodData Central, Recharts, Framer Motion, and OpenAI.

## Features

- Google sign-in ready through Clerk
- Profile onboarding for age, gender, height, weight, goal, activity level, target calories, and protein goal
- Instant food search with USDA FoodData Central fallback-ready architecture
- Indian, custom, packaged, and restaurant food support through local seeds and custom entries
- Meal logging with calories, protein, carbs, fat, fiber, meal type, timestamp, edit/delete-ready APIs, duplication, favorites, and recipes schema
- Dashboard with daily progress, macro chart, weekly trends, water, weight, streaks, and smart scores
- AI coach for meal recommendations, goal-based feedback, natural language parsing, and meal quality scoring
- PWA manifest and offline-friendly shell

## API Routes

- `GET /api/profile` - current user profile, demo fallback if unauthenticated
- `POST /api/profile` - create/update onboarding profile
- `GET /api/foods?q=rice` - USDA/local food search
- `GET /api/food-logs` - current user's food logs
- `POST /api/food-logs` - create a food log
- `PATCH /api/food-logs/:id` - update a food log owned by the user
- `DELETE /api/food-logs/:id` - delete a food log owned by the user
- `GET /api/custom-foods` - list custom foods
- `POST /api/custom-foods` - create custom food
- `PATCH /api/custom-foods/:id` - update custom food
- `DELETE /api/custom-foods/:id` - delete custom food
- `GET /api/weights` - list weight entries
- `POST /api/weights` - create weight entry
- `PATCH /api/weights/:id` - update weight entry
- `DELETE /api/weights/:id` - delete weight entry
- `GET /api/dashboard` - daily totals, scores, trends, profile, and logs
- `POST /api/ai/parse-food` - parse natural-language food text
- `POST /api/ai/insights` - generate AI nutrition suggestions

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add real keys.

3. Start PostgreSQL:

```bash
docker compose up postgres -d
```

4. Push the schema:

```bash
npm run db:push
```

5. Start the app:

```bash
npm run dev
```

## Why Some Foods May Not Show Up Locally

Food search uses USDA FoodData Central when `USDA_API_KEY` is configured. If the key is missing or set to `DEMO_KEY`, MacroMind falls back to the local seed list in `lib/demo-data.ts`.

For production, add a real USDA key so searches like soybean, packaged foods, and restaurant-style foods come from a large nutrition database. The local seed list is only a demo safety net.

## Deployment

### 1. Create Required Accounts

- Vercel for hosting the Next.js app.
- Neon, Supabase, Railway, or Render for PostgreSQL.
- Clerk for authentication and Google sign-in.
- OpenAI for AI meal parsing and nutrition suggestions.
- USDA FoodData Central for food search.

### 2. Create PostgreSQL Database

Use Neon or Supabase for the fastest setup.

1. Create a new project/database.
2. Copy the pooled PostgreSQL connection string.
3. Make sure the connection string includes username, password, host, database, and SSL settings if your provider requires them.

Example:

```bash
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Configure Clerk Auth

1. Create a Clerk application.
2. Enable Google as a social provider.
3. Add these development URLs in Clerk while testing:

```text
http://localhost:3000
http://localhost:3000/onboarding
```

4. Add your production Vercel URL after deployment.
5. Copy the Clerk keys into your environment variables.

### 4. Configure API Keys

Create `.env` locally from `.env.example`:

```bash
cp .env.example .env
```

Fill these:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_or_test_..."
CLERK_SECRET_KEY="sk_live_or_test_..."
OPENAI_API_KEY="sk-..."
USDA_API_KEY="your_usda_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Prepare Database Locally

```bash
npm install
npm run db:generate
npm run db:push
```

Use `db:push` for prototype deployment. For a stricter production workflow, replace this with Prisma migrations:

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy
```

### 6. Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 7. Deploy To Vercel

1. Push this project to GitHub.
2. Open Vercel and import the repository.
3. Select Next.js as the framework.
4. Add environment variables in Vercel Project Settings:

```bash
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
OPENAI_API_KEY
USDA_API_KEY
NEXT_PUBLIC_APP_URL
```

5. Set `NEXT_PUBLIC_APP_URL` to the final Vercel production URL.
6. Use this build command:

```bash
npm run build
```

7. Use this install command:

```bash
npm install
```

### 8. Run Prisma In Production

For the current prototype:

```bash
npm run db:push
```

For production migrations:

```bash
npx prisma migrate deploy
```

On Vercel, you can run migrations manually from your machine against the production `DATABASE_URL`, or create a release command in your hosting provider if supported.

### 9. Docker Deployment

Create `.env` first, then run:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port `5432`
- MacroMind on port `3000`

Then push the schema:

```bash
docker compose exec web npx prisma db push
```

### 10. Production Checklist

- Use a real `USDA_API_KEY`; otherwise food search is limited to local seeds.
- Restrict Clerk redirect URLs to your real domains.
- Keep `OPENAI_API_KEY` server-only. Never expose it as `NEXT_PUBLIC_*`.
- Add rate limiting before public launch.
- Use Prisma migrations instead of `db:push` once schema changes stabilize.
- Add a background job or cron for weekly nutrition reports.
- Add provider adapters for Nutritionix and Edamam in `lib/food-search.ts`.

## Future Integrations

The food provider layer in `lib/food-search.ts` is designed for Nutritionix and Edamam adapters. Add provider modules that normalize to the `NutritionEntry` shape.
