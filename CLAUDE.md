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
├── bills.ts          # getBillsService, billActionService, etc.
├── vendors.ts        # getVendorsService, createVendorService, etc.
└── payments.ts       # getPaymentsService, paymentActionService
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
- Vendors use a mixed ownership model: global vendors (`ownerId IS NULL`) are visible to all users and read-only; private vendors (`ownerId = user.id`) are visible and editable only by their creator. Use `or(isNull(vendorsTable.ownerId), eq(vendorsTable.ownerId, user.id))` to filter accessible vendors.
- `vendor_payment_methods` is a join table (`vendorId` FK + `method` enum). Never store arrays of enums as `text[]` — Drizzle cannot change a column type via `db:push` without data loss.
- `VendorWithMethods` (in `types/index.ts`) extends `Vendor` with `paymentMethods: string[]` — always use this type in services, hooks, and components that deal with vendor payment methods.
- Reusable Drizzle filter helpers live in `db/filters.ts` (e.g. `accessibleVendorFilter`).

### API Routes

- Always wrap in `try/catch` — never let errors escape unhandled
- Use `getAuthenticatedUser()` from `lib/auth.ts` in every protected route — never inline the Clerk + DB lookup
- Response format: `{ data }` for success, `{ error }` for failures
- Add `export const maxDuration = 30` to every handler file (`get.ts`, `post.ts`) — never in `route.ts`, that would be a duplicate
- Validate referenced resources before INSERT (e.g. vendor before bill) — return 422 if not found
- Validate uniqueness per owner before INSERT — return 409 if duplicate
- API routes return 401 JSON for unauthenticated requests — middleware handles this separately from page redirects
- Use `z.iso.date()` for date fields in Zod — stricter than regex, rejects invalid dates like `2020-01-32`
- When a table has no `ownerId`, filter by ownership via `INNER JOIN` on the related table that does. Use `db.select().from().innerJoin()` instead of `db.query.findMany()` for this pattern — the relational query API doesn't support filtering by related table fields in `where`.

### Hooks & Services

- One hook per folder: `hooks/use[Entity]Query/use[Entity]Query.ts` + `index.ts`
- Hook naming: `use[Entity]Query` for queries, `use[Action][Entity]Mutation` for mutations
- Service functions live in `services/[entity].ts` — pure async functions, no React
- Axios instance from `@/lib/api` — never use raw `fetch` in services

### Components

- Page titles live in `pageTitles` record in `components/layout/TopBar.tsx` — never add `<h1>` to dashboard pages, the TopBar already renders it
- Client Components need `"use client"` — default is Server Component in App Router
- shadcn components live in `components/ui/` — never modify them directly
- Status badges use CVA variants — add new statuses to `BillStatusBadge`
- Reusable form primitives in `components/ui/form-fields/` — `FormField`, `FormInput`, `FormTextarea`, `FormSelect`, `FormDateInput`
- `FormSelect` takes `options: { value: string; label: string }[]` + optional `placeholder` (rendered as disabled option)
- Components with 2+ distinct sections → extract each into `components/[entity]/info/` subfolder from the start. Use a `Field` primitive for label/value pairs.
- Use `<Link href="...">` for navigation instead of `router.push()` or `router.back()` — works without JS, prefetches, and never silently fails when there's no history
- Label maps (e.g. `paymentMethodLabels`) go in `lib/formatters.ts` typed as `Record<Schema["field"], string>` — never inline as `Record<string, string>`
- Always use `<Button>` from `@/components/ui/button` instead of raw `<button>` — raw buttons hardcode colors that break in dark mode (`bg-primary` resolves differently per theme)
- `variant="link"` for actions that navigate or reset URL state (e.g. "Clear filters"); `variant="ghost"` for low-emphasis actions; `variant="outline"` for secondary actions in error/empty states
- `ErrorFallback` uses `py-16 text-center items-center` — centered in its container, not flush to top-left

### Discriminated union para prop groups opcionales

Cuando N props solo tienen sentido juntas (e.g. selección de filas), usá un discriminated union con `prop?: never` en la rama vacía — TypeScript exige todos o ninguno en el call site:

```ts
type SelectionProps =
  | { onToggle: (id: string) => void; selectedIds: Set<string>; allSelected: boolean; ... }
  | { onToggle?: never; selectedIds?: never; allSelected?: never; ... };
```

Nota: el narrowing no atraviesa funciones separadas. Si una función interna usa los props, agregá `if (!guardProp) return` al inicio como workaround para satisfacer al compilador.

### React Hook Form + Zod v4

When a schema has `.default()` or `.coerce`, input and output types diverge. Use three type params:

```ts
useForm<z.input<typeof schema>, unknown, z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

Export both types from `lib/validators.ts`: `z.infer<>` for the output, `z.input<>` for the form input.

---

## Workflow

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

### `formatCurrency` caches `Intl.NumberFormat` per currency

`Intl.NumberFormat` is expensive to instantiate. `formatCurrency` uses a module-level `Map` (`currencyFormatterCache`) to cache one instance per currency. `isoDateToLocal` and `MS_PER_DAY` are also exported from `lib/formatters.ts` and are reusable in API routes and services.

### `isError` vs `!data` in React Query pages

These are distinct states. `isError=true` → request failed, show error + retry. `!data` with `isError=false` → TypeScript narrowing, never visible in practice → `return null`. Do not collapse both into `if (isError || !data)`. Empty state is handled internally by the table component.

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

### `Select.onValueChange` can pass `null`

Base UI's `Select` (used via shadcn) types `onValueChange` as `(value: string | null, ...) => void`. Never pass a `(v: string) => void` handler directly — TypeScript will reject it. Always wrap with a null guard:

```ts
onValueChange={(v) => { if (v !== null) onChange(v); }}
```

### Zod action schemas must match exactly what the handler implements

If `billActionSchema` accepts `["submit", "approve", "reject", "archive"]` but the handler only implements `"approve"` and `"reject"`, a client sending `{ action: "submit" }` will pass validation and silently fall into the `else` branch (reject). Keep the enum in sync with what the code actually handles.

### React Query `queryKey` — never pass a filter object directly

`queryKey: ["bills", filters]` causes unnecessary refetches because React Query compares by object identity. Spread individual scalar values instead:

```ts
queryKey: ["bills", filters?.status, filters?.vendorId];
```

### `payments` table has no `ownerId` — filter via bill JOIN

`payments` intentionally has no `ownerId`. Ownership is derived via the bill. Use `INNER JOIN bills WHERE bills.ownerId = user.id` — never add `ownerId` to payments directly, it would create an invariant (`payment.ownerId === bill.ownerId`) with no performance benefit at this scale.

### `isNull()` from drizzle-orm is a SQL node, not a boolean

`isNull(table.column)` constructs a SQL expression — it is always truthy in JS. Never use it in an `if` statement or boolean check. Use `value === null` to check fetched data, and `isNull()` only inside Drizzle `where` clauses.

### ACTION_CONFIG pattern for status transitions

When multiple actions share the same structure (status guard → db.update → race check), use an `ACTION_CONFIG` lookup table instead of if-blocks. Adding a new action is a one-liner in the config.

```ts
const ACTION_CONFIG: Record<MyAction, { requiredStatus: ...; errorMessage: string; patch: ... }> = {
  submit:  { requiredStatus: "draft",             errorMessage: "...", patch: { status: "awaiting_approval" } },
  approve: { requiredStatus: "awaiting_approval", errorMessage: "...", patch: { status: "approved" } },
  // ...
};
```

If one action needs a side effect (e.g. `approve` requires a DB transaction + payment insert), keep it as a special branch that still reads `requiredStatus`/`errorMessage` from the config — the data-driven guard and the transactional side effect are separate concerns.

Extract the shared `db.update` block into a typed helper that accepts `db` or a transaction `tx`:

```ts
type DbExecutor = Pick<typeof db, "update">;

async function updateStatus(executor: DbExecutor, id: string, requiredStatus: ..., patch: ...) {
  const [updated] = await executor.update(table).set({...patch, updatedAt: new Date()})
    .where(and(eq(table.id, id), eq(table.status, requiredStatus))).returning({ id: table.id });
  if (!updated) throw new Error("RACE_LOST");
}
```

For simple if-chain handlers (not using ACTION_CONFIG), still end with `action satisfies never` as a compile-time exhaustiveness guard.

### Demo login bypass — cookie `demo-session`

`POST /api/auth/demo` sets an httpOnly cookie `demo-session=true`. The bypass is wired in 4 places: `proxy.ts` (skips Clerk auth), `app/(dashboard)/layout.tsx` (skips `auth.protect()`), `app/page.tsx` (redirects to `/bills`), and `lib/auth.ts` (uses `DEMO_CLERK_ID` env var as clerkId). The demo user must exist in the Neon `users` table with that clerkId.

`getAuthenticatedUser()` now exposes `isDemo` in its return value — use it instead of reading `cookies()` a second time in the same request.

`useDemoSession` is the client-side hook for demo session state: exposes `isDemo`, `user` (name + email from `GET /api/auth/me`), `signIn`, and `signOut`. The sign-in page uses `useDemoLoginMutation` directly — not `useDemoSession` — to avoid a 401 fetch before any session exists.

### New Clerk users have no DB record — auto-upserted on first request

`getAuthenticatedUser()` in `lib/auth.ts` auto-creates the user row on first authenticated request via `currentUser()` + INSERT with `onConflictDoNothing`. A refetch fallback handles the race condition where two simultaneous requests both pass the initial `findFirst` miss before either inserts. No webhook infrastructure needed — the upsert is the single chokepoint for all 9 protected API routes.

### `vi.mock` factory — use `vi.hoisted()` for external variables

When a `vi.mock` factory references a variable declared outside it, Vitest hoists the factory to the top of the file — before the variable is initialized. Use `vi.hoisted()` to declare the variable in the same hoisted scope:

```ts
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));

vi.mock("some/module", () => ({
  someExport: vi.fn().mockResolvedValue({ set: mockFn }),
}));
```

### Payment lifecycle — manual actions, no background processor

`scheduled → [Release] → initiated → [Mark as paid] → paid`
`initiated → [fails externally] → failed → [Retry] → scheduled`

All three actions (release, mark_paid, retry) are manual Finance Manager actions — same model as Ramp. `PATCH /api/payments/:id` accepts `{ action: "release" | "mark_paid" | "retry" }`.

`ACTION_CONFIG` in `patch.ts` is a lookup table keyed by `PaymentAction` — each entry declares `requiredStatus`, `errorMessage`, and `patch` fields. `handlePaymentAction` uses it to drive a single `db.update` instead of three separate if-branches. Adding a new action is a one-liner in the config.

The PATCH handler does two SELECTs: the first fetches the payment with an ownership JOIN (`bills.ownerId = user.id`); the second re-fetches after the update to build `PaymentWithRelations` for the response — both must include the ownership filter. A missing filter on the second SELECT is an IDOR vector.

### Test date helpers — use `getFullYear/getMonth/getDate`, not `toISOString()`

When building ISO date strings in tests (`"YYYY-MM-DD"`), never use `new Date().toISOString().split("T")[0]` — it converts to UTC before the split, returning tomorrow's date in UTC-N timezones past a certain hour. Always reset to local midnight first and use local getters:

```ts
function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

### Dark mode — shadcn's `--primary` changes in dark mode by design

Dark mode is implemented via `next-themes`. `ThemeToggle` is an isolated Client Component using `resolvedTheme` + a `mounted` pattern to avoid hydration mismatch. The `mounted` pattern is correct and necessary — the IDE linter complains but `pnpm lint` passes clean.

### Recharts `<Pie>` — use `fill` field in data, not `color`

`<Pie>` automatically picks up a `fill` field from each data object for both sector color and legend color. Naming it `color` silently falls back to the default (grey legend). `<Cell>` is deprecated in Recharts 3.x — do not use it.
