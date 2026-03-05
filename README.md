# Shiba — Full-Stack Boilerplate

React 19 + Vite · Tailwind CSS v3 · shadcn/ui · TanStack Query · React Router
Node.js · Express · TypeScript · PostgreSQL · Prisma

---

## Project Structure

```
shiba/
├── client/          # Vite + React 19 frontend
├── server/          # Express + TypeScript backend
└── package.json     # Root scripts (concurrently)
```

---

## Getting Started

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Configure the database

Copy the example environment file and fill in your PostgreSQL credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mydb?schema=public"
PORT=5000
```

### 3. Run database migrations

```bash
npm run db:migrate --prefix server
# or
cd server && npx prisma migrate dev --name init
```

This applies the schema (including the sample `User` model) and regenerates the Prisma client.

> **Prisma 7 note:** Connection config lives in `server/prisma.config.ts` (used by CLI tools)
> and is also passed directly to `PrismaClient` via `@prisma/adapter-pg` at runtime.
> The `url` field is no longer set inside `schema.prisma`.

### 4. Start development servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend** → http://localhost:5173 (Vite dev server, proxies `/api` to port 5000)
- **Backend**  → http://localhost:5000

Run them individually if needed:

```bash
npm run dev:server   # Express server only
npm run dev:client   # Vite dev server only
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both servers concurrently |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build both for production |
| `npm run db:migrate --prefix server` | Run Prisma migrations |
| `npm run db:generate --prefix server` | Regenerate Prisma client |
| `npm run db:studio --prefix server` | Open Prisma Studio |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v3 |
| UI components | shadcn/ui (New York · Zinc) |
| Data fetching | TanStack Query v5 |
| Routing | React Router v7 |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
