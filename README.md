# Billy — Accounts Payable Manager

Billy is an accounts payable tool for operations teams that need to track, approve, and pay vendor invoices. The core insight: **a Bill and a Payment are two distinct domain objects with independent lifecycles**. A Bill is an accounting fact (the invoice). A Payment is the fund transfer. Conflating them leads to broken workflows — Billy keeps them separate from the start.

**Live demo:** https://billy-takehome.vercel.app/bills

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

| Variable                              | Description                                        |
| ------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                        | Neon connection string                             |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk publishable key                              |
| `CLERK_SECRET_KEY`                    | Clerk secret key                                   |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`       | Sign-in route (default: `/sign-in`)                |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`       | Sign-up route (default: `/sign-up`)                |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in (default: `/bills`)         |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up (default: `/bills`)         |
| `NEXT_PUBLIC_APP_URL`                 | Base URL of the app (e.g. `http://localhost:3000`) |

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

| Method | Path                 | Description                                                                            |
| ------ | -------------------- | -------------------------------------------------------------------------------------- |
| GET    | `/api/bills`         | List bills for the authenticated user (`?status=`, `?vendorId=`)                       |
| POST   | `/api/bills`         | Create a new bill (with optional line items)                                           |
| GET    | `/api/bills/:id`     | Get a single bill with payment and line items                                          |
| PATCH  | `/api/bills/:id`     | Submit, approve, or reject a bill (`{ action: "submit" \| "approve" \| "reject" }`)    |
| GET    | `/api/vendors`       | List accessible vendors (global + own), with payment methods                           |
| POST   | `/api/vendors`       | Create a private vendor                                                                |
| PATCH  | `/api/vendors/:id`   | Update a private vendor's name, email, or payment methods                              |
| GET    | `/api/payments`      | List payments for the authenticated user (`?status=`, `?paymentMethod=`, `?vendorId=`) |
| GET    | `/api/reports/aging` | AP Aging Report — open bills bucketed by days past due, grouped by vendor              |

All endpoints require a valid Clerk session. Responses follow `{ data }` on success and `{ error }` on failure.

---

## Workflows Prioritized

### Bill Lifecycle

The full AP approval flow:

```
Draft → Awaiting Approval → Approved → [Payment auto-created]
                         ↘ Rejected → Archived
```

Bills start as drafts, get submitted for approval, and transition atomically: approving a bill creates a scheduled payment in the same database transaction. No payment without an approved bill. No approved bill without a payment.

### Payment Lifecycle

```
Scheduled → Initiated → Paid
                     ↘ Failed → Scheduled (retry)
```

Payments are first-class objects. Finance teams can track status, mark as paid, and retry failures — independently of the bill that originated them.

### AP Aging Report

Overdue bills grouped by aging bucket: 0–30, 31–60, 61–90, 90+ days. This is the report every AP team actually uses to manage cash flow. Including it signals product understanding, not just CRUD fluency.

### Supporting features

- Vendors CRUD (name, email, payment methods) with mixed ownership model (global + private)
- Bills table with tabs as work queues: Drafts · Awaiting Approval · For Payment · History
- Filters: status, vendor, amount range, due date range — stored in URL params (bookmarkable, server-side)
- Sortable columns: vendor, amount, status, due date
- Bill detail page with contextual actions per status
- Line items per bill

---

## What's Out and Why

| Feature                  | Why excluded                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Invoice scanning (OCR)   | Too large a surface for a demo — would shift focus from the AP workflow to file processing infrastructure.   |
| Real ACH / wire payments | Would require setting up a payment gateway. No time, and not what this demo is evaluating.                   |
| Multi-approver chains    | Single-user demo — one person plays all roles. The model supports adding role checks without schema changes. |
| Bulk actions             | Low value with demo-scale data. Natural v2 once the single-record flow is solid.                             |
| CSV export               | v2.                                                                                                          |

**On approval model:** In production, the approver would be a different user than the bill creator. Billy allows self-approval for demo simplicity. This is noted explicitly — the data model supports adding a role check at the API layer without schema changes.

---

## Architecture & Data Model

### Stack

| Layer     | Choice                     | Reason                                                            |
| --------- | -------------------------- | ----------------------------------------------------------------- |
| Framework | Next.js 16 App Router      | API Routes included — one repo, no CORS, typed backend            |
| UI        | shadcn/ui + Tailwind 4     | Clean design system close to Ramp/Linear aesthetic                |
| ORM       | Drizzle ORM                | Schema in pure TypeScript, no codegen step, type-safe queries     |
| Database  | Neon (serverless Postgres) | Free tier, Vercel-compatible, no connection pooling config needed |
| Auth      | Clerk                      | Production-grade auth in under 20 minutes                         |

### Key decisions

**`amount` as `numeric(12,2)`, not `float`**
Floating-point arithmetic is wrong for money. `numeric` gives exact decimal storage at the Postgres layer. Drizzle maps it to `string` in TypeScript — we parse to `number` only at the formatting layer.

**`status` as Postgres enum, not a string column**
Enums enforce valid values at the database level. Transition gating lives in the API (`POST /api/bills/[id]/actions`) — invalid transitions return `400` with a clear error message.

**Approve as an atomic DB transaction**
`bill.status → approved` and `INSERT INTO payments` happen in a single transaction. Either both succeed or neither does. No approved bill without a payment; no orphaned payment without an approved bill.

**URL as filter state**
Filters are stored in URL search params, not React state. The Server Component reads them directly and filters server-side. Bookmarkable, shareable, and no client-side waterfall.

**`bill_line_items` with CASCADE**
Deleting a bill deletes its line items. No orphaned rows, no soft-delete complexity at this scope.

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

## User Stories

| ID    | Story                                                                                                          | Status  |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------- |
| US-00 | As a developer, I want realistic seed data so I can develop and demo the system without manual data entry.     | ✅ Done |
| US-01 | As an AP Manager, I want to see a list of all my bills so I can have an overview of pending payables.          | ✅ Done |
| US-02 | As an AP Manager, I want to create a new bill with line items so I can register vendor invoices.               | ✅ Done |
| US-03 | As an AP Manager, I want to filter bills by status and vendor so I can prioritize my work queue.               | ✅ Done |
| US-04 | As an AP Manager, I want to view a bill's full detail including line items and payment info.                   | ✅ Done |
| US-05 | As an AP Manager, I want to approve or reject a bill so I can control which invoices get paid.                 | ✅ Done |
| US-06 | As a Finance Manager, I want an AP Aging Report grouped by overdue buckets so I can manage cash flow risk.     | ✅ Done |
| US-07 | As an AP Manager, I want to submit a draft bill for approval so it enters the approval queue.                  | ✅ Done |
| US-08 | As a Finance Manager, I want to see a list of all payments so I can track fund transfers and their status.     | ✅ Done |
| US-09 | As an AP Manager, I want to manage vendors so I can register and update the companies I pay.                   | ✅ Done |
| US-10 | As a user, I want a polished UI with consistent colors and visual hierarchy so the app feels production-ready. | 🔲 Todo |
