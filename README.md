# Sheba Management

A full-stack scheduling and management application built with **React** (client) and **Express + TypeScript** (server), using **PostgreSQL** with **Prisma** ORM.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) running locally on port `5432`
- npm (comes with Node.js)

## Project Structure

```
sheba/
├── client/   # React + Vite frontend
├── server/   # Express + TypeScript backend
└── docs/     # Documentation
```

## Getting Started

### 1. Database Setup

Create a PostgreSQL database named `shiba_management`:

```bash
psql -U postgres -c "CREATE DATABASE shiba_management;"
```

### 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file from the example
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/shiba_management?schema=public"
PORT=3001
JWT_SECRET="your-secret-key"

# SMTP (optional — OTP codes are logged to console when not configured)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@sheba.co.il
```

Then run the database migrations and start the server:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start the dev server
npm run dev
```

The server will run on **http://localhost:3001**.

### 3. Client Setup

Open a new terminal:

```bash
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The client will run on **http://localhost:5173** (Vite default) and automatically proxy `/api` requests to the server at `localhost:3001`.

## Available Scripts

### Server (`/server`)

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server with hot reload   |
| `npm run build`      | Compile TypeScript to `dist/`      |
| `npm start`          | Run compiled server from `dist/`   |
| `npm run db:migrate` | Run Prisma migrations              |
| `npm run db:generate`| Generate Prisma client             |
| `npm run db:studio`  | Open Prisma Studio (DB browser)    |
| `npm run db:seed`    | Seed the database                  |

### Client (`/client`)

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start Vite dev server         |
| `npm run build`   | Build for production          |
| `npm run preview` | Preview production build      |
| `npm run lint`    | Run ESLint                    |

## Tech Stack

### Client
- React 19, TypeScript, Vite
- TanStack React Query, Zustand
- Tailwind CSS, Radix UI, shadcn/ui
- React Hook Form + Zod validation
- React Router, i18next (i18n)

### Server
- Express 5, TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication, bcrypt
- Nodemailer (email/OTP)
