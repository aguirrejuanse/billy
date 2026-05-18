import { NextRequest, NextResponse } from "next/server";
import { eq, and, SQL } from "drizzle-orm";
import { db } from "@/db";
import { bills as billsTable, payments as paymentsTable } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { billActionSchema } from "@/lib/validators";
import { isValidUuid } from "@/lib/utils";
import { Bill, BillDetailParams } from "@/types";

type RouteParams = { params: Promise<BillDetailParams> };

interface HandleBillActionParams {
  action: "approve" | "reject";
  bill: Bill;
}

async function handleBillAction({
  action,
  bill,
}: HandleBillActionParams): Promise<NextResponse | undefined> {
  if (bill.status !== "awaiting_approval") {
    return NextResponse.json(
      {
        error: `Bill cannot be ${action === "approve" ? "approved" : "rejected"} in current status`,
      },
      { status: 400 }
    );
  }

  if (action === "approve") {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(billsTable)
        .set({ status: "approved", updatedAt: new Date() })
        .where(and(eq(billsTable.id, bill.id), eq(billsTable.status, "awaiting_approval")))
        .returning({ id: billsTable.id });

      if (!updated) throw new Error("RACE_LOST");

      await tx.insert(paymentsTable).values({
        billId: bill.id,
        vendorId: bill.vendorId,
        amount: bill.amount,
        status: "scheduled",
        scheduledDate: bill.dueDate,
        paymentMethod: bill.paymentType,
      });
    });
  } else {
    const [updated] = await db
      .update(billsTable)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(and(eq(billsTable.id, bill.id), eq(billsTable.status, "awaiting_approval")))
      .returning({ id: billsTable.id });

    if (!updated) throw new Error("RACE_LOST");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const parsed = billActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }
    const { action } = parsed.data;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Action not supported" }, { status: 422 });
    }

    const ownedBill: SQL = and(eq(billsTable.id, id), eq(billsTable.ownerId, user.id)) as SQL;
    const bill = await db.query.bills.findFirst({ where: ownedBill });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const actionError = await handleBillAction({ action, bill });
    if (actionError) return actionError;

    const updated = await db.query.bills.findFirst({
      where: ownedBill,
      with: { vendor: true, lineItems: true, payment: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "RACE_LOST") {
      return NextResponse.json({ error: "Bill status changed concurrently" }, { status: 409 });
    }
    // eslint-disable-next-line no-console
    console.error("[PATCH /api/bills/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
