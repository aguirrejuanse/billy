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
- Vendors are global/shared — no `ownerId`, all authenticated users see the same vendor list. This is intentional.

### API Routes

- Always wrap in `try/catch` — never let errors escape unhandled
- Use `getAuthenticatedUser()` from `lib/auth.ts` in every protected route — never inline the Clerk + DB lookup
- Response format: `{ data }` for success, `{ error }` for failures
- Add `export const maxDuration = 30` to every API route file
- Validate referenced resources before INSERT (e.g. vendor before bill) — return 422 if not found
- Validate uniqueness per owner before INSERT — return 409 if duplicate
- API routes return 401 JSON for unauthenticated requests — middleware handles this separately from page redirects
- Use `z.iso.date()` for date fields in Zod — stricter than regex, rejects invalid dates like `2020-01-32`

### Hooks & Services

- One hook per folder: `hooks/use[Entity]Query/use[Entity]Query.ts` + `index.ts`
- Hook naming: `use[Entity]Query` for queries, `use[Action][Entity]Mutation` for mutations
- Service functions live in `services/[entity].ts` — pure async functions, no React
- Axios instance from `@/lib/api` — never use raw `fetch` in services

### Components

- Client Components need `"use client"` — default is Server Component in App Router
- shadcn components live in `components/ui/` — never modify them directly
- Status badges use CVA variants — add new statuses to `BillStatusBadge`
- Reusable form primitives in `components/ui/form-fields/` — `FormField`, `FormInput`, `FormTextarea`, `FormSelect`, `FormDateInput`
- `FormSelect` takes `options: { value: string; label: string }[]` + optional `placeholder` (rendered as disabled option)
- Components with 2+ distinct sections → extract each into `components/[entity]/info/` subfolder from the start. Use a `Field` primitive for label/value pairs.
- Use `<Link href="...">` for navigation instead of `router.push()` or `router.back()` — works without JS, prefetches, and never silently fails when there's no history
- Label maps (e.g. `paymentMethodLabels`) go in `lib/formatters.ts` typed as `Record<Schema["field"], string>` — never inline as `Record<string, string>`

### React Hook Form + Zod v4

When a schema has `.default()` or `.coerce`, input and output types diverge. Use three type params:

```ts
useForm<z.input<typeof schema>, unknown, z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

Export both types from `lib/validators.ts`: `z.infer<>` for the output, `z.input<>` for the form input.

---

## Workflow

- User executes all terminal commands — Claude only instructs what to run and waits for output
- Run `/simplify` after creating utility files (formatters, validators, hooks, etc.)
- Commit after each logical step with conventional commits
- One branch per feature: `feat/[feature-name]`
- Before `/pr`: update README API table + OpenAPI spec if a new route was added; mark User Stories ✅ Done if completed

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

### neon-http does NOT support transactions

Use `neon-serverless` driver (`Pool` + `drizzle/neon-serverless`) in `db/index.ts`. `neon-http` throws "No transactions support" at runtime when `db.transaction()` is called.

### Client Component providers must live inside `<body>`

Wrapping `<html>` with a Client Component (e.g. `ReactQueryProvider`) breaks CSS variable resolution — fonts and theme variables stop working. Always nest providers inside `<body>`.

### Drizzle date columns return strings

`date("column")` in Drizzle schema returns `string` (ISO format `"YYYY-MM-DD"`), not `Date`. Use `isoDateToLocal(date)` from `formatters.ts` — it appends `T00:00:00` to parse in local time, avoiding an off-by-one day for users west of UTC. TODO: migrate columns to `{ mode: "date" }` to get `Date` objects directly and eliminate the helper.

### `auth.protect()` redirects instead of returning 401

Clerk's `auth.protect()` in middleware redirects to sign-in instead of returning a JSON 401. For API routes, use `const { userId } = await auth()` and return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` manually. See `middleware.ts` for the `isApiRoute` pattern.
