# Billy — AP Manager Takehome

## What is Billy?

Billy is an Accounts Payable manager built as a takehome project for Trashlab. It allows AP teams to manage vendor bills through their full lifecycle: creation, approval, rejection, and payment scheduling.

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | Next.js 16 (App Router)                       |
| Language  | TypeScript                                    |
| Styling   | Tailwind 4 + shadcn/ui (Nova preset)          |
| State     | React Query (server) — no client global state |
| Forms     | React Hook Form + Zod                         |
| API       | Axios → Next.js API Routes                    |
| ORM       | Drizzle ORM → Neon (Postgres serverless)      |
| Auth      | Clerk                                         |

**Import alias:** `@/` maps to project root (e.g., `@/components`, `@/lib/api`)

---

## Folder Structure

```
app/
├── (auth)/           # sign-in, sign-up (Clerk)
├── (dashboard)/      # protected pages
│   └── bills/        # bills list + detail + new
└── api/              # API routes
    └── bills/        # GET, POST + [id] routes
components/
├── bills/            # BillsTable, BillStatusBadge, etc.
├── layout/           # Sidebar, TopBar
├── providers/        # ReactQueryProvider
└── ui/               # shadcn components
db/
├── index.ts          # Drizzle + Neon connection
├── schema.ts         # All tables and enums
└── seed.ts           # Dev seed script
hooks/
└── use[Entity]Query/ # folder-per-hook, barrel export via index.ts
lib/
├── api.ts            # Axios instance (baseURL: /api)
├── formatters.ts     # formatCurrency, formatDate, formatRelativeDate
├── validators.ts     # Zod schemas
└── utils.ts          # cn(), general utils
services/
└── bills.ts          # getBillsService, etc.
types/
└── index.ts          # BillWithRelations, PaymentWithRelations
```

---

## Critical Conventions

### Data layer

- `numeric(12,2)` columns map to `string` in TypeScript — call `Number()` only at the formatting layer (`formatCurrency`)
- `updatedAt` must be set manually on every PATCH — Postgres doesn't auto-update it
- Drizzle `pgEnum.enumValues` in Zod validators — single source of truth, no duplicated string arrays
- Approve bill is an atomic DB transaction: `bill.status → approved` + `INSERT payment`

### API Routes

- Always wrap in `try/catch` — never let errors escape unhandled
- Always check `auth()` from Clerk before any DB query
- Resolve `clerkId → users.id` before filtering by `ownerId`
- Response format: `{ data }` for success, `{ error }` for failures

### Hooks & Services

- One hook per folder: `hooks/use[Entity]Query/use[Entity]Query.ts` + `index.ts`
- Hook naming: `use[Entity]Query` for queries, `use[Action][Entity]Mutation` for mutations
- Service functions live in `services/[entity].ts` — pure async functions, no React
- Axios instance from `@/lib/api` — never use raw `fetch` in services

### Components

- Client Components need `"use client"` — default is Server Component in App Router
- shadcn components live in `components/ui/` — never modify them directly
- Status badges use CVA variants — add new statuses to `BillStatusBadge`

---

## Workflow

- User executes all terminal commands — Claude only instructs what to run and waits for output
- Run `/simplify` after creating utility files (formatters, validators, hooks, etc.)
- Commit after each logical step with conventional commits
- One branch per feature: `feat/[feature-name]`

---

## Development Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm lint         # ESLint check
pnpm lint:fix     # Auto-fix lint issues
pnpm typecheck    # TypeScript check
pnpm db:push      # Push schema changes to Neon
pnpm db:seed      # Run seed script
pnpm db:studio    # Open Drizzle Studio
```

---

## Common Tasks

### Add a new shadcn component

```bash
pnpm dlx shadcn@latest add [component]
```

---

## Key Files Reference

| Purpose         | File                          |
| --------------- | ----------------------------- |
| DB              | `db/index.ts`, `db/schema.ts` |
| Axios client    | `lib/api.ts`                  |
| Zod validators  | `lib/validators.ts`           |
| Shared types    | `types/index.ts`              |
| Auth middleware | `middleware.ts`               |

---

## Gotchas & Tribal Knowledge

### Server Components can't fetch their own API with auth

Next.js Server Components run in Node.js without browser cookies — Clerk auth fails on internal fetch calls. Use Client Components with React Query for authenticated data fetching.

### Drizzle date columns return strings

`date("column")` in Drizzle schema returns `string` (ISO format `"YYYY-MM-DD"`), not `Date`. The `toDate()` helper in `formatters.ts` handles the conversion before formatting.
