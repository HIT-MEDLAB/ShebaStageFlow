# Frontend Architecture & Guidelines

## 1. Tech Stack & Core Rules
| Category | Technology |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + Shadcn/UI |
| Routing | React Router v7 (Data API: loaders/actions) |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 (Slice Pattern) |
| Validation | Zod + React Hook Form |
| HTTP | Axios (centralized instance only) |
| Notifications | Sonner |
| Icons | lucide-react (No other icon libraries allowed) |

**Rule:** No alternative libraries may be introduced without explicit instruction.

## 2. Directory Structure
src/
├── app/                          # Global setup only (App.tsx, router.tsx, providers/)
├── components/                   # Reusable UI ONLY — no business logic
│   ├── ui/                       # Shadcn primitives only
│   └── shared/                   # Global composite components
├── features/                     # ALL business logic lives here
│   └── [feature-name]/
│       ├── api/                  # API functions for this feature
│       ├── components/           # Feature-scoped components
│       ├── hooks/                # Feature-scoped hooks
│       ├── pages/                # Route-level components
│       ├── schemas/              # Zod schemas + derived types
│       ├── types/                # Feature-only types
│       └── stores/               # (Optional) Client UI state only
├── hooks/                        # Truly global hooks — no feature coupling
├── lib/                          # Pure utilities — no React (apiClient.ts, utils.ts)
└── types/                        # Global shared types only

## 3. UI & Component Rules
- Always look for generic, "dumb" components that accept params and can be highly reusable.
- If a generic component is specific ONLY to a feature, place it in `features/[feature]/components/`.
- Screen/Page files (`features/[feature]/pages/`) MUST act ONLY as orchestrators. They should call custom hooks for data/state, and pass that data down to the "dumb" generic components as props. Zero complex business logic should live directly inside the Page component itself.
- Separate complex logic into custom hooks to keep component files readable, expandable, and scalable.

## 4. React Router v7 Rules
- Define route `loaders` and `actions` directly inside the feature's `pages/` components, or export them from a dedicated `[feature].routes.ts` file.
- Loaders should prefetch data using the TanStack Query `queryClient`.
- All global route definitions must live in `src/app/router.tsx`.

## 5. Data Fetching & State
- Server data comes from the API and lives **only** in TanStack Query.
- MUST NOT be stored in Zustand or manually cached.
- **Absolute Rules:**
  - Never fetch inside `useEffect`. Always use `useQuery` or Router loaders.
  - Never run queries without required deps. Guard with `enabled`.
  - Never call API directly from a component. Route through a hook.
- **Query Keys:** MUST follow `[featureName, operation, ...params]`.
- **Mutations:** Always invalidate related queries in `onSuccess`. Never update Zustand with the response.

## 6. API Layer Rules
- All API functions MUST live in `features/[feature]/api/[feature].api.ts`.
- Always use the centralized `apiClient` (`import { apiClient } from "@/lib/apiClient";`).
- Component → Hook → API function (Direct calls from components are forbidden).

## 7. React 19 Rules
- **Forms:** MUST use `useActionState`, React Hook Form, and Zod validation. Do NOT use raw `useState` for field management.
- **Refs:** Pass `ref` as a normal prop. Do NOT use `forwardRef`.

## 8. TypeScript Rules
- No `any` (use `unknown` + type guards).
- Derive types from Zod (`z.infer<typeof schema>`).
- Strict API response typing (no implicit `any` from Axios).

## 9. Import Rules
- Use path aliases (e.g., `@/lib/apiClient`).
- Features expose public API via `index.ts` only. Cross-feature imports must go through `index.ts`. No deep imports into another feature's internals.

## 10. Styling Rules
- Use Tailwind only — no inline styles, no CSS modules.
- Use `cn()` utility from `lib/utils.ts` for conditional classes.
- No business logic inside UI primitives (`components/ui/`).

## 11. Error Handling
- Every route MUST define an `errorElement`.
- Surface user-facing errors via Sonner (`toast.error(...)`).
- 401 handling MUST be centralized in `apiClient` interceptors. Do not silently swallow errors.

## 12. Naming Conventions
- **Components/Pages:** PascalCase (`UserCard.tsx`, `UsersPage.tsx`)
- **Hooks:** camelCase with `use` prefix (`useUsers.ts`)
- **Feature Files:** `[feature].api.ts`, `[feature].schema.ts`, `[feature].types.ts`, `[feature]UiSlice.ts`
- **Utilities:** camelCase (`formatDate.ts`)

## 13. Configuration & Env
- Access environment variables ONLY through a typed config file or `import.meta.env`.
- Do not hardcode API URLs. Ensure `VITE_API_URL` is defined.

## 14. Decision Priority
Apply rules in this exact order:
1. Feature architecture rules (highest)
2. Data ownership rules
3. API layer rules
4. React 19 rules
5. Type safety rules
6. Styling rules (lowest)
