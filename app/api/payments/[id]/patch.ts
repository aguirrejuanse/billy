import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  payments as paymentsTable,
  bills as billsTable,
  vendors as vendorsTable,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { paymentActionSchema, PaymentAction } from "@/lib/validators";
import { isValidUuid } from "@/lib/utils";
import type { Payment } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

// data-driven programming pattern
const ACTION_CONFIG: Record<
  PaymentAction,
  {
    requiredStatus: Payment["status"];
    errorMessage: string;
    patch: Partial<Payment>;
  }
> = {
  release: {
    requiredStatus: "scheduled",
    errorMessage: "Only scheduled payments can be released",
    patch: { status: "initiated", initiatedAt: new Date() },
  },
  mark_paid: {
    requiredStatus: "initiated",
    errorMessage: "Only initiated payments can be marked as paid",
    patch: { status: "paid", paidAt: new Date() },
  },
  retry: {
    requiredStatus: "failed",
    errorMessage: "Only failed payments can be retried",
    patch: { status: "scheduled", initiatedAt: null },
  },
};

async function handlePaymentAction(
  action: PaymentAction,
  payment: Payment
): Promise<NextResponse | Payment> {
  const { requiredStatus, errorMessage, patch } = ACTION_CONFIG[action];

  if (payment.status !== requiredStatus)
    return NextResponse.json({ error: errorMessage }, { status: 400 });

  const [updated] = await db
    .update(paymentsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(paymentsTable.id, payment.id), eq(paymentsTable.status, requiredStatus)))
    .returning();

  if (!updated) throw new Error("RACE_LOST");
  return updated;
}

export const maxDuration = 30;

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const [{ user, error }, { id }] = await Promise.all([getAuthenticatedUser(), params]);
    if (error) return error;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const parsed = paymentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }
    const { action } = parsed.data;

    const payment = await db
      .select({ payment: paymentsTable })
      .from(paymentsTable)
      .innerJoin(
        billsTable,
        and(eq(paymentsTable.billId, billsTable.id), eq(billsTable.ownerId, user.id))
      )
      .where(eq(paymentsTable.id, id))
      .limit(1)
      .then((rows) => rows[0]?.payment ?? null);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const result = await handlePaymentAction(action, payment);
    if (result instanceof NextResponse) return result;

    const updated = await db
      .select({ payment: paymentsTable, bill: billsTable, vendor: vendorsTable })
      .from(paymentsTable)
      .innerJoin(
        billsTable,
        and(eq(paymentsTable.billId, billsTable.id), eq(billsTable.ownerId, user.id))
      )
      .innerJoin(vendorsTable, eq(paymentsTable.vendorId, vendorsTable.id))
      .where(eq(paymentsTable.id, result.id))
      .limit(1)
      .then((rows) =>
        rows[0] ? { ...rows[0].payment, bill: rows[0].bill, vendor: rows[0].vendor } : null
      );

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "RACE_LOST") {
      return NextResponse.json({ error: "Payment status changed concurrently" }, { status: 409 });
    }
    console.error("[PATCH /api/payments/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
