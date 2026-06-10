# Billy — Accounts Payable Manager

Billy is an accounts payable tool for operations teams that need to track, approve, and pay vendor invoices. The core insight: **a Bill and a Payment are two distinct domain objects with independent lifecycles**. A Bill is an accounting fact (the invoice). A Payment is the fund transfer. Conflating them leads to broken workflows — Billy keeps them separate from the start.

**Live demo:** https://billy-takehome.vercel.app/bills

**Demo video:** https://www.loom.com/share/b3a173de260a4c2592dafda974f42057

---

## Features | What you can do

- **Demo login** — one click, no signup required
- **Bills** — create, submit, approve, reject, archive; import from CSV; export to CSV
- **Payments** — release, mark as paid, retry failed payments
- **Vendors** — create and manage vendors with payment methods
- **Reports** — AP Aging Report with charts, bucket breakdown, and CSV export
- **Dark mode**
- **Responsive design**

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- A [Neon](https://neon.tech) database
- A [Clerk](https://clerk.com) application

### Installation

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                              | Description                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | Neon PostgreSQL connection string                                                                       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk publishable key (from your Clerk dashboard)                                                       |
| `CLERK_SECRET_KEY`                    | Clerk secret key (from your Clerk dashboard)                                                            |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`       | Path for the sign-in page (default: `/sign-in`)                                                         |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`       | Path for the sign-up page (default: `/sign-up`)                                                         |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Path to redirect to after a successful sign-in (default: `/bills`)                                      |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Path to redirect to after a successful sign-up (default: `/bills`)                                      |
| `NEXT_PUBLIC_APP_URL`                 | Base URL of the app (e.g., `http://localhost:3000`)                                                     |
| `DEMO_CLERK_ID`                       | Clerk user ID for the demo account — must exist in the `users` table. Enables the one-click demo login. |

### Database

```bash
pnpm db:push   # apply schema to Neon
pnpm db:seed   # seed test data
```

### Run

```bash
pnpm dev       # http://localhost:3000
```

---

## API Documentation

The full spec is in [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1.0).

| Method | Path                       | Description                                                                                                                            |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/bills`               | List bills for the authenticated user. Supports `?status=` and `?vendorId=` filters.                                                   |
| POST   | `/api/bills`               | Create a new bill with optional line items.                                                                                            |
| GET    | `/api/bills/:id`           | Get a single bill including its vendor, line items, and payment.                                                                       |
| PATCH  | `/api/bills/:id`           | Transition a bill's status. Accepts `{ action: "submit" \| "approve" \| "reject" \| "archive" }`.                                      |
| GET    | `/api/vendors`             | List all accessible vendors (global and user-owned), each with their payment methods.                                                  |
| POST   | `/api/vendors`             | Create a new private vendor owned by the authenticated user.                                                                           |
| PATCH  | `/api/vendors/:id`         | Update a private vendor's name, email, or payment methods.                                                                             |
| GET    | `/api/payments`            | List payments for the authenticated user. Supports `?status=`, `?paymentMethod=`, `?vendorId=` filters.                                |
| PATCH  | `/api/payments/:id`        | Transition a payment's status. Accepts `{ action: "release" \| "mark_paid" \| "retry" }`.                                              |
| GET    | `/api/reports/aging`       | AP Aging Report — open bills bucketed by days past due, grouped by vendor. Supports `?endDate=YYYY-MM-DD` to get a point-in-time view. |
| POST   | `/api/bills/import/create` | Bulk-create bills from a pre-validated CSV payload. Returns `{ imported, errors }` with partial success. Max 50 rows per request.      |
| POST   | `/api/auth/demo`           | Start a demo session — sets an httpOnly cookie valid for 8 hours. Requires `DEMO_CLERK_ID` env var.                                    |
| POST   | `/api/auth/demo/logout`    | End the demo session — deletes the demo cookie.                                                                                        |
| GET    | `/api/auth/me`             | Return current user's name, email, and whether it's a demo session.                                                                    |

All endpoints except `/api/auth/demo` and `/api/auth/demo/logout` require a valid Clerk or demo session. Responses follow `{ data }` on success and `{ error }` on failure.

---

## Workflows Prioritized

### Bill Lifecycle

The full AP approval flow:

```
Draft → Awaiting Approval → Approved → [Payment auto-created]
                         ↘ Rejected → Archived
```

Bills start as drafts, get submitted for approval, and transition atomically — approval and payment creation happen in a single DB transaction. See [Key decisions](#key-decisions) for the rationale.

### Payment Lifecycle

```
Scheduled → Initiated → Paid
                     ↘ Failed → Scheduled (retry)
```

Payments are first-class objects. Finance teams can track status, mark as paid, and retry failures — independently of the bill that originated them.

---

## What's Out and Why

| Feature                  | Why excluded                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Invoice scanning (OCR)   | Too large a surface for a demo — would shift focus from the AP workflow to file processing infrastructure.   |
| Real ACH / wire payments | Would require setting up a payment gateway. No time, and not what this demo is evaluating.                   |
| Multi-approver chains    | Single-user demo — one person plays all roles. The model supports adding role checks without schema changes. |
| Bulk approve/reject      | Row selection is in place (US-16). Bulk status transitions are the natural next step (US-18).                |

**On the approval model:** In production, the approver would be a different user than the bill creator. Billy allows self-approval for demo simplicity — the data model supports adding a role check at the API layer without any schema changes.

---

## Architecture & Data Model

### Stack

| Layer     | Choice                     | Reason                                                            |
| --------- | -------------------------- | ----------------------------------------------------------------- |
| Framework | Next.js 16 App Router      | API Routes included — one repo, no CORS, typed backend            |
| UI        | shadcn/ui + Tailwind 4     | Clean design system close to Ramp/Linear aesthetic                |
| Theming   | next-themes                | Dark mode with system-aware toggle, persisted in localStorage     |
| ORM       | Drizzle ORM                | Schema in pure TypeScript, no codegen step, type-safe queries     |
| Database  | Neon (serverless Postgres) | Free tier, Vercel-compatible, no connection pooling config needed |
| Auth      | Clerk                      | Production-grade auth in under 20 minutes                         |

### Key decisions

**`amount` as `numeric(12,2)`, not `float`**
Floating-point arithmetic is wrong for money. `numeric` provides exact decimal storage at the Postgres layer. Drizzle maps it to `string` in TypeScript — we parse to `number` only at the formatting layer.

**`status` as a Postgres enum, not a string column**
Enums enforce valid values at the database level. Transition gating lives in the API — invalid transitions return `400` with a clear error message.

**Bill approval as an atomic DB transaction**
`bill.status → approved` and `INSERT INTO payments` happen in a single transaction. Either both succeed or neither does. No approved bill without a payment; no orphaned payment without an approved bill.

**Semantic color tokens + dark mode**
All colors go through CSS custom properties (`--primary`, `--status-approved-bg`, etc.) bridged into Tailwind via `@theme inline`. Dark mode flips the token values — no component-level color logic. The sidebar has its own sub-theme (`--sidebar-*`) so it adapts independently.

**URL as filter state**
Filters are stored in URL search params, not React state. The Server Component reads them directly and filters server-side — bookmarkable, shareable, and no client-side waterfall.

**`bill_line_items` with CASCADE**
Deleting a bill cascades to its line items. No orphaned rows, no soft-delete complexity at this scope.

### Data model

```
users                — clerk_id, name, email
vendors              — name, email, owner_id (null = global)
vendor_payment_methods — vendor_id (CASCADE), method (enum)
bills                — vendor_id, owner_id, number, amount, status, invoice_date, due_date, payment_type
bill_line_items      — bill_id (CASCADE), description, amount, account_code
payments             — bill_id, vendor_id, amount, status, scheduled_date, payment_method
```

Types are inferred directly from the Drizzle schema via `InferSelectModel` — single source of truth, no duplication between schema and TypeScript types.

---

## Development Process

Each feature followed a structured workflow: implement → `/simplify` (refactor for reuse and quality) → red team (harden edge cases and security) → write tests → `/pr` (update README + OpenAPI, fill PR template, review before creating). All conventions, gotchas, and architectural decisions are captured in [`CLAUDE.md`](./CLAUDE.md).

See [`docs/ai-workflow.md`](./docs/ai-workflow.md) for the full breakdown: skills used, evidence in the repo, and skills worth building for future projects.

---

## User Stories

| ID    | Story                                                                                                                            | Status  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| US-00 | As a developer, I want realistic seed data so I can develop and demo the system without manual data entry.                       | ✅ Done |
| US-01 | As an AP Manager, I want to see a list of all my bills so I can have an overview of pending payables.                            | ✅ Done |
| US-02 | As an AP Manager, I want to create a new bill with line items so I can register vendor invoices.                                 | ✅ Done |
| US-03 | As an AP Manager, I want to filter bills by status and vendor so I can prioritize my work queue.                                 | ✅ Done |
| US-04 | As an AP Manager, I want to view a bill's full detail including line items and payment info.                                     | ✅ Done |
| US-05 | As an AP Manager, I want to approve or reject a bill so I can control which invoices get paid.                                   | ✅ Done |
| US-06 | As a Finance Manager, I want an AP Aging Report grouped by overdue buckets so I can manage cash flow risk.                       | ✅ Done |
| US-07 | As an AP Manager, I want to submit a draft bill for approval so it enters the approval queue.                                    | ✅ Done |
| US-08 | As a Finance Manager, I want to see a list of all payments so I can track fund transfers and their status.                       | ✅ Done |
| US-09 | As an AP Manager, I want to manage vendors so I can register and update the companies I pay.                                     | ✅ Done |
| US-10 | As a user, I want a polished UI with consistent colors and visual hierarchy so the app feels production-ready.                   | ✅ Done |
| US-11 | As a reviewer, I want to try the app instantly without signing up so I can evaluate it without friction.                         | ✅ Done |
| US-13 | As a Finance Manager, I want to mark payments as paid or retry failed payments so I can keep payment statuses accurate.          | ✅ Done |
| US-14 | As an AP Manager, I want to archive rejected bills so I can keep my active queue clean.                                          | ✅ Done |
| US-15 | As an AP Manager, I want to import bills from a CSV so I can onboard invoices in bulk.                                           | ✅ Done |
| US-16 | As an AP Manager, I want to export bills and payments to CSV so I can share data with my team or import into other tools.        | ✅ Done |
| US-17 | As a Finance Manager, I want to download the AP Aging Report as CSV so I can analyze it offline.                                 | ✅ Done |
| US-18 | As an AP Manager, I want to select multiple bills and approve, reject, or archive them in bulk so I can process my queue faster. | 🔲 Todo |
| US-19 | As a reviewer, I want a guided demo tour with tooltips so I can understand key features without exploring on my own.             | ✅ Done |
