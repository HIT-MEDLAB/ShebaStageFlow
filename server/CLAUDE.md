# Backend Architecture & Guidelines

## 1. Stack
- **Runtime:** Node.js + TypeScript (`strict: true`)
- **Framework:** Express 5
- **ORM:** Prisma 7 (driver adapter pattern)
- **Database:** PostgreSQL
- **Validation:** Zod 4
- **Auth:** bcrypt + jsonwebtoken
- **Testing:** Jest + Supertest + ts-jest

## 2. Directory Structure
src/
├── modules/                      # One folder per domain entity
│   └── [entity]/
│       ├── [entity].routes.ts    # Paths, HTTP methods, middleware attachment
│       ├── [entity].controller.ts# HTTP transport layer
│       ├── [entity].service.ts   # Business logic (framework-agnostic)
│       ├── [entity].repository.ts# Data access (Prisma calls) + IRepository interface
│       └── [entity].schema.ts    # Zod schemas & inferred DTO types
├── shared/
│   ├── database/
│   │   └── prismaClient.ts       # Singleton PrismaClient (driver adapter)
│   ├── errors/
│   │   └── AppError.ts           # Operational error class
│   └── middlewares/
│       ├── errorHandler.ts       # Global Express error middleware
│       └── validateRequest.ts    # Zod validation middleware factory
├── api/
│   └── routes/
│       └── index.ts              # Root API router mounts all module routers
├── app.ts                        # Express app factory (no listen call)
└── server.ts                     # Entry point (listen only)
tests/
├── mocks/
│   └── prismaClient.ts           # Jest manual mock (named export const prisma)
├── integration/                  # Supertest tests against createApp()
└── unit/                         # Unit tests with mocked repositories

## 3. Strict Layer Rules
- **Routes (`[entity].routes.ts`):** Zero business logic. No `if`, no DB calls. Attaches middleware only.
- **Schemas (`[entity].schema.ts`):** All Zod schemas for request validation. Export inferred DTO types.
- **Controllers (`[entity].controller.ts`):** HTTP transport layer only. Extracts data, passes to Service, writes response. Always wrap in `try/catch` and call `next(err)`. MUST NOT import Prisma or repositories.
- **Services (`[entity].service.ts`):** Core business logic. Framework-agnostic (no Express imports). Receives repository via constructor injection (interface-based). Throws `AppError`.
- **Repositories (`[entity].repository.ts`):** Data access layer only. The ONLY file allowed to import/use `prisma`. Exports DTO type, Interface, and concrete implementation Class.

## 4. Prisma 7 Rules (Critical)
- `schema.prisma` datasource block has **no `url`**.
- `prisma.config.ts` provides `datasource.url` for CLI commands only.
- `PrismaClient` **must** receive a driver adapter at construction time (Requires `pg`, `@prisma/adapter-pg`, `@types/pg`).

## 5. TypeScript & Validation Rules
- `strict: true` — no `any` types anywhere. Never use `as any` or `// @ts-ignore`.
- Use Zod 4 for validation. Infer types with `z.infer<>`. Use `error.issues` (NOT `error.errors`).

## 6. Testing Rules
- **Unit:** Test Services in isolation, inject mock repositories.
- **Integration:** Use `createApp()` + Supertest, no real DB.
- **Mocks:** `jest.config.js` maps `prismaClient` imports to `tests/__mocks__/prismaClient.ts` (must use named export: `export const prisma = { ... }`).
- Run `npm test` and confirm passes before reporting task completion.

## 7. Security Rules
- `helmet` and `cors` on every app instance.
- Passwords hashed with `bcrypt` (min 10 salt rounds). JWT with explicit `expiresIn`.
- **No hardcoded secrets.** All via `process.env['KEY']`.
- Never leak stack traces to the client.

## 8. Naming Conventions
- **Module folder:** `snake_case` (`auth/`)
- **File names:** `[entity].[layer].ts` (`auth.service.ts`)
- **Classes:** `PascalCase` (`AuthService`)
- **Interfaces:** `I` prefix (`IUserRepository`)
- **Controllers:** Plain object/const (`export const AuthController = { ... }`)
- **Routers:** camelCase `Router` suffix (`export const authRouter`)
