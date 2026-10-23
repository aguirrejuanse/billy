# Billy — Technical Plan

## Sesión de Planificación

**Duración:** ~1 hora  
**Fecha:** 12 Mayo 2026

### Decisiones tomadas en la charla

**Stack:**

- Empezamos evaluando Next.js + API Routes vs. Next.js + server Node separado → elegimos **Next.js 15 App Router con API Routes** (menos overhead, un solo repo, sin CORS)
- Auth: discutimos Clerk vs. NextAuth. Clerk ganó for setup speed. Para producción a largo plazo: Clerk si querés delegar auth management, NextAuth si querés control total y cero dependencias externas.
- UI: styled-components choca con App Router por el modelo de Server Components (CSS-in-JS con runtime). Elegimos **shadcn/ui + Tailwind** porque el evaluador mide design/UI explícitamente y shadcn tiene estilo más cercano a Ramp/Linear.
- ORM: **Drizzle** sobre Prisma — más ligero, schema en TypeScript puro, queries type-safe, setup más rápido.
- DB: **Neon** (Postgres serverless) — gratuito, compatible con Vercel, sin fricción de deploy.

**Product understanding:**

- Aclaramos la diferencia entre el flujo sin approval (Draft → Scheduled → Paid) vs. el flujo real con approval (Draft → Awaiting Approval → Approved → Payment auto-creado).
- Insight clave: **Bill y Payment son dos objetos de dominio distintos con lifecycles propios**. La Bill es el hecho contable; el Payment es la transferencia de fondos. Se crean en la misma transaction DB cuando se aprueba una Bill.
- El AP Aging Report se incluyó en el MVP como señal de "product taste" — es una feature real que todo equipo de finanzas necesita.

**Scope:**

- Decidimos incluir el approval flow simplificado: el mismo usuario puede aprobar sus propias bills. En producción sería un aprobador distinto — se documenta en el README como decisión consciente.
- OUT explícito: OCR, multi-approver chains, pagos reales (ACH/wire), ERP sync, multi-entity.

---

## Context

Full-stack product exercise. El evaluador mide: product taste, design/UI, scope judgment, UX quality, sistemas simples y robustos, output crudo.

El producto es un **Accounts Payable (AP) manager** inspirado en Ramp Bill Pay. El insight central del producto es que hay **dos objetos de dominio distintos** con lifecycles propios:

- **Bill** — el invoice / hecho contable. Lifecycle: Draft → Awaiting Approval → Approved (+ Rejected, Archived)
- **Payment** — la transferencia de fondos. Se crea automáticamente cuando una Bill es Aprobada. Lifecycle: Scheduled → Initiated → Paid (+ Failed)

Esta separación demuestra product understanding. Si modelás eso bien, el evaluador lo ve de inmediato.

---

## Stack (decidido)

| Capa      | Tecnología                 | Razón                                                         |
| --------- | -------------------------- | ------------------------------------------------------------- |
| Framework | Next.js 15 App Router      | API Routes incluidas, no necesitás server Node separado       |
| Lenguaje  | TypeScript                 |                                                               |
| UI        | shadcn/ui + Tailwind CSS   | Estilo tipo Ramp/Linear, evaluador mide design explícitamente |
| ORM       | Drizzle ORM                | Ligero, schema en TS puro, queries type-safe                  |
| DB        | Postgres (Neon serverless) | Gratuito, serverless, compatible con Vercel                   |
| Auth      | Clerk                      | Auth listo en 20min, enfocás tiempo en el producto            |
| Deploy    | Vercel + Neon              | Gratuitos, el evaluador puede testear sin setup               |

**Por qué NO server Node separado:** overhead de setup (CORS, dos procesos, dos puertos) sin beneficio real. API Routes de Next.js 15 son un backend real, tipado, en el mismo repo.

---

## Scope MVP

### IN

- Auth (Clerk) — login/logout
- Bills table con tabs: Drafts | Awaiting Approval | For Payment | History
- Filtros: status, vendor, amount range, due date range
- Columnas ordenables: vendor, amount, status, due date, invoice date
- Crear bill (slide-over): vendor, amount, fechas, payment type, line items
- Bill detail page con acciones contextuales por status
- Lifecycle de bill: Submit → Approve → Reject → Archive
- Auto-crear Payment cuando Bill es Aprobada
- Payments tab: tabla con filtros + acciones (Schedule, Mark as Paid, Fail/Retry)
- Vendors CRUD básico
- AP Aging Report (overdue bills agrupadas por bucket: 0-30, 31-60, 61-90, 90+ días)
- Seed data: ~20 bills en distintos estados, 7 vendors realistas

### OUT (documentar en README con justificación)

- OCR / file upload (requiere S3 + Textract)
- Multi-approver chains (requiere workflow engine)
- Pagos reales ACH/wire (requiere Plaid/Stripe Treasury)
- ERP sync (QuickBooks, NetSuite)
- Multi-entity
- Export CSV (nice-to-have si sobra tiempo)

---

## Data Model

```sql
-- Enums
payment_method: ach | wire | check | card
bill_status: draft | awaiting_approval | approved | rejected | archived
payment_status: scheduled | initiated | paid | failed

-- Tables
users (id uuid PK, clerk_id text UNIQUE, name text, email text UNIQUE, created_at, updated_at)
vendors (id uuid PK, name text, email text?, payment_method enum, created_at, updated_at)
bills (id uuid PK, vendor_id → vendors, owner_id → users, number text, amount numeric(12,2),
       currency text default 'USD', status enum default 'draft',
       invoice_date date, due_date date, description text?,
       payment_type enum, created_at, updated_at)
bill_line_items (id uuid PK, bill_id → bills CASCADE, description text, amount numeric(12,2), account_code text?)
payments (id uuid PK, bill_id → bills, vendor_id → vendors, amount numeric(12,2),
          status enum default 'scheduled', scheduled_date date,
          initiated_at timestamp?, paid_at timestamp?, payment_method enum, notes text?, created_at, updated_at)
```

**Decisiones clave:**

- `status` como enum Postgres, no string libre — gating de transiciones en la API
- `amount` como `numeric(12,2)`, no `float` — evita errores de punto flotante en dinero
- `bill_line_items` con `CASCADE` — al eliminar una bill, se eliminan sus line items
- `created_at` / `updated_at` en todas las tablas — auditoría y ordenamiento
- Tipos inferidos de Drizzle con `InferSelectModel` — una sola fuente de verdad

---

## Bill Lifecycle (State Machine)

```
                    submit
[Draft] ──────────────────────→ [Awaiting Approval]
                                        │
                              approve ──┼── reject
                                        │         │
                                        ↓         ↓
                                   [Approved]  [Rejected]
                                        │         │
                                        │ auto    │ archive
                                        ↓         ↓
                                   [Payment]   [Archived]
                                   created!
```

```
Payment lifecycle (auto-creado al aprobar Bill):

[Scheduled] → [Initiated] → [Paid]
                    └──────→ [Failed] → [Scheduled] (retry)
```

La transición **approve** es atómica (DB transaction):

1. Bill status → `approved`
2. INSERT payment con `status = 'scheduled'`, `scheduled_date = bill.due_date`

---

## Estructura de Archivos

```
src/
  app/
    (auth)/
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
    (dashboard)/
      layout.tsx          ← Clerk guard + shell (Sidebar + TopBar)
      bills/
        page.tsx          ← Server component, tabs, filtros por URL params
        [id]/page.tsx     ← Bill detail, 2 columnas
      payments/page.tsx
      vendors/page.tsx
      reports/page.tsx    ← AP Aging
    api/
      bills/
        route.ts          ← GET (list+filters) + POST (create)
        [id]/
          route.ts        ← GET + PATCH + DELETE(→archive)
          actions/route.ts ← POST {action: submit|approve|reject|archive}
      payments/
        route.ts          ← GET list
        [id]/route.ts     ← PATCH status
      vendors/route.ts    ← CRUD
      users/sync/route.ts ← POST: upsert Clerk user localmente
  components/
    bills/
      BillsTable.tsx
      BillsTableColumns.tsx
      BillsTableFilters.tsx
      BillCreateSheet.tsx   ← Slide-over (shadcn Sheet)
      BillStatusBadge.tsx
      BillActions.tsx
    payments/
      PaymentsTable.tsx
      PaymentStatusBadge.tsx
      PaymentActions.tsx
    vendors/
      VendorsTable.tsx
      VendorForm.tsx
    reports/
      ApAgingSummaryCards.tsx
      ApAgingTable.tsx
    layout/
      Sidebar.tsx
      TopBar.tsx
  db/
    schema.ts
    index.ts
    seed.ts
  lib/
    formatters.ts   ← formatCurrency, formatDate, formatRelativeDate
    validators.ts   ← Zod schemas (CreateBillInput, CreateVendorInput)
  types/index.ts    ← Tipos inferidos de Drizzle + join types
```

---

## UX Patterns Clave

1. **Tabs como work queues** — no son solo filtros visuales. Drafts=autoría, Awaiting=aprobación, For Payment=finanzas. Espeja exactamente como Ramp estructura el flujo AP.
2. **URL como estado de filtros** — filtros en search params, no React state. Bookmarkable, shareable, y el Server Component puede pre-filtrar server-side.
3. **Slide-over para crear bill** — el usuario mantiene contexto de la lista mientras crea. Mucho mejor UX que navegar a una página separada.
4. **Status badges con color semántico** — draft=gris, awaiting=amarillo, approved=verde, rejected=rojo, archived=gris oscuro.
5. **AP Aging Report** — feature de "product taste". Muestra entendimiento del workflow real de AP, no solo CRUD.
6. **Acciones contextuales** — los botones de acción cambian según el status actual. No mostrás "Approve" en una bill ya aprobada.

---

## API — Ruta más Compleja

`POST /api/bills/[id]/actions` con `{ action: "submit" | "approve" | "reject" | "archive" }`:

```
submit  : draft             → awaiting_approval
approve : awaiting_approval → approved  [+ INSERT payment en la misma transaction]
reject  : awaiting_approval → rejected
archive : draft | rejected  → archived
```

Cualquier transición inválida devuelve 400 con mensaje claro.

---

## Seed Data

7 vendors con nombres realistas de waste management:

- WasteStream Solutions, RecycleCore LLC, GreenHaul Transport, Apex Landfill Services, EcoSort Technologies, Municipal Bin Rentals, CleanCity Contractors

~20 bills distribuidas:

- 4 Draft (recientes, montos chicos)
- 4 Awaiting Approval
- 5 Approved (mix on-time y overdue — para que AP Aging sea no trivial)
- 3 Rejected
- 4 Archived

Payments auto-generados para bills aprobadas (2 paid, 1 failed para realismo).

---

## Timeline — 4 días

### Día 1 — Foundation

- Bootstrap proyecto, instalar deps, shadcn init
- Drizzle schema + migración
- Clerk auth + middleware + root layout
- Dashboard shell (Sidebar + TopBar)
- Types + formatters + validators

### Día 2 — Bills Core

- API routes: bills CRUD + lifecycle actions
- Status badges
- BillsTable + columns + filtros
- BillCreateSheet (slide-over)

### Día 3 — Features Restantes

- Bill detail page
- Payments table + acciones
- Vendors CRUD
- AP Aging report
- Seed data

### Día 4 — Polish + Ship

- Empty states + loading skeletons
- Error handling + toast notifications
- README
- Deploy Vercel + Neon + verificación end-to-end

---

## Deploy

```bash
# Local
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm db:seed
pnpm dev

# Prod
pnpm db:push  # contra Neon prod
DATABASE_URL=<prod> pnpm db:seed
vercel deploy --prod
```

Env vars en Vercel: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`

---

## Verificación End-to-End

| Feature     | Verificar                                                |
| ----------- | -------------------------------------------------------- |
| Auth        | Sign in, sign out, redirect a /bills                     |
| Tabs        | Cada tab muestra solo bills del status correcto          |
| Crear bill  | Sheet abre, valida, bill aparece en Drafts               |
| Submit      | Draft → Awaiting Approval                                |
| Approve     | Awaiting → For Payment; Payment auto-creado              |
| Reject      | Awaiting → History con badge Rejected                    |
| Archive     | Draft/Rejected → History con badge Archived              |
| Bill detail | Datos correctos, botones correctos por status            |
| Payments    | Bills aprobadas tienen payment; status updates funcionan |
| Vendors     | CRUD funciona; vendor aparece en create form             |
| AP Aging    | Bills vencidas agrupadas correctamente, totales exactos  |
| Filtros     | Vendor filter, amount range, date range funcionan        |
| Sorting     | Click en column header ordena correctamente              |
