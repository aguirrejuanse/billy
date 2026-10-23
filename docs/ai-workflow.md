# AI Workflow — Billy

This document describes how Claude Code was used throughout this project: which skills were active, where their impact is visible in the repo, and which skills would be worth building for future projects of this type.

---

## Philosophy

The model is simple: **the human directs, the AI executes**. Claude Code was never used to generate code blindly and paste it in. Every output was reviewed, validated, and often pushed back on before being committed.

The key enabler is [`CLAUDE.md`](../CLAUDE.md) — a persistent context file at the project root that the AI reads at the start of every session. It contains conventions, gotchas, architectural decisions, and the expected workflow. Without it, the AI would "forget" decisions made in previous sessions and drift toward generic patterns. With it, every session starts with full project context.

---

## Workflow Per Feature

Every feature followed this 8-step loop:

```
1. Branch       feat/[feature-name]
2. Spec         Read the user story, clarify intent, plan before coding
3. Implement    Active skills applied inline (API routes, hooks, forms)
4. /simplify    Refactor for reuse and quality — remove duplication, tighten types
5. Red team     Harden edge cases: race conditions, invalid inputs, auth bypass vectors
6. Tests        Cover the happy path, validation errors, auth, and DB failure
7. /pr          README + OpenAPI updated, PR template filled, review before creating
8. Merge        Clean conventional commit history, one concern per commit
```

---

## Skills Used

### Installed skills (pinned in `skills-lock.json`)

| Skill               | What it does                                                                    | Evidence in repo                                        |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `nextjs-api-routes` | Next.js 15 API route patterns — `maxDuration`, error handling, auth, validation | `.agents/skills/nextjs-api-routes/`, `skills-lock.json` |

### Built-in skills (invoked via slash commands)

| Skill                        | When it ran                                                  | Evidence in repo                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/simplify`                  | After each feature, before PR                                | `fix(reports): apply simplify and red team fixes to aging report`, `refactor: simplify and harden approve/reject bill feature`, `refactor(bills): simplify vendor/paymentType initialization` |
| `/pr`                        | At the end of every feature branch                           | 8 merged PRs, each with README API table + OpenAPI spec updated before creation                                                                                                               |
| `code-review-excellence`     | Red team pass alongside `/simplify`                          | `fix(vendors): tighten VendorWithMethods paymentMethods type and red team fixes`                                                                                                              |
| `vitest`                     | Writing tests for each API endpoint                          | `app/api/bills/get.test.ts`, `post.test.ts`, `app/api/payments/get.test.ts`, `app/api/reports/aging/get.test.ts`, `app/api/vendors/*.test.ts`, `lib/validators.test.ts`                       |
| `nextjs-15`                  | App Router patterns, Server Components, route groups         | `app/(dashboard)/`, `app/(auth)/`, `middleware.ts`                                                                                                                                            |
| `react-query`                | Query and mutation hooks with proper `queryKey` invalidation | `hooks/use*Query/` — one hook per folder with barrel export                                                                                                                                   |
| `nextjs-app-router-patterns` | Layouts, middleware, auth-protected routes                   | Route group structure, Clerk middleware integration                                                                                                                                           |
| `react-hook-form-zod`        | Forms with Zod validation and shadcn inputs                  | `components/bills/CreateBillForm.tsx`, `components/vendors/`                                                                                                                                  |

---

## Skills Worth Building

These are patterns that came up repeatedly across features and had to be re-established manually each time. A skill would have prevented multiple bugs and saved setup time.

### `drizzle-neon`

**Why:** Every feature that touched the DB ran into at least one of these:

- `neon-http` does not support transactions → must use `neon-serverless` (`Pool` + `drizzle/neon-serverless`)
- `numeric(12,2)` columns return `string` in TypeScript — parse to `number` only at the formatting layer
- `date("column")` returns `"YYYY-MM-DD"` string, not `Date` — need `isoDateToLocal()` to avoid off-by-one day in UTC-N timezones
- `isNull(table.column)` is a SQL expression node, always truthy in JS — never use in `if` statements
- `updatedAt` must be set manually on every `UPDATE` — Postgres does not auto-update it

A skill encoding these gotchas would prevent a class of silent bugs that only appear in production or in specific timezones.

### `clerk-nextjs`

**Why:** The correct auth pattern for API routes had to be re-established in `CLAUDE.md` because it's non-obvious:

- `auth.protect()` redirects to sign-in — wrong for API routes, which need a JSON `401`
- Correct pattern: `const { userId } = await auth()` + manual `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`
- The `isApiRoute` check in `middleware.ts` separates page redirects from API 401s
- `getAuthenticatedUser()` helper in `lib/auth.ts` centralizes the Clerk + DB user lookup — every protected route calls this, never inlines it

### `ap-domain-model`

**Why:** The Bills/Payments/Vendors model with its invariants is a reusable foundation for any AP tool:

- Bills and Payments are distinct domain objects with independent lifecycles
- Approval is atomic: `bill.status → approved` + `INSERT payment` in one transaction
- Vendors use a mixed ownership model: global (`ownerId IS NULL`) + private (`ownerId = user.id`)
- The AP Aging Report (overdue buckets) is the standard cash flow management report every AP team needs

Encoding this as a skill — schema, service patterns, and key invariants — would give any AP project a production-grade foundation from day one.

---

## What CLAUDE.md Actually Does

`CLAUDE.md` is not documentation. It is the AI's working memory for the project.

At the start of every session, the AI reads it and recovers full project context: what conventions apply, what gotchas have been discovered, what decisions were made and why. This is what makes multi-session development with AI coherent — without it, every session starts from zero and the AI drifts toward generic patterns that conflict with project-specific decisions.

The file evolved throughout the project. Every time a new gotcha was discovered (e.g., `isNull()` as a SQL node, `toISOString()` timezone bug in tests, `auth.protect()` redirecting instead of returning 401), it was added to `CLAUDE.md` so it would never have to be re-explained.
