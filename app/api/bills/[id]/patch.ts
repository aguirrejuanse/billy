import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { bills as billsTable, payments as paymentsTable } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { billActionSchema, BillAction } from "@/lib/validators";
import { isValidUuid } from "@/lib/utils";
import { Bill, BillDetailParams } from "@/types";

type RouteParams = { params: Promise<BillDetailParams> };

type BillPatch = Partial<Pick<Bill, "status">>;
type DbExecutor = Pick<typeof db, "update">;

const ACTION_CONFIG: Record<
  BillAction,
  { requiredStatus: Bill["status"]; errorMessage: string; patch: BillPatch }
> = {
  submit: {
    requiredStatus: "draft",
    errorMessage: "Only draft bills can be submitted",
    patch: { status: "awaiting_approval" },
  },
  approve: {
    requiredStatus: "awaiting_approval",
    errorMessage: "Bill cannot be approved in current status",
    patch: { status: "approved" },
  },
  reject: {
    requiredStatus: "awaiting_approval",
    errorMessage: "Bill cannot be rejected in current status",
    patch: { status: "rejected" },
  },
  archive: {
    requiredStatus: "rejected",
    errorMessage: "Only rejected bills can be archived",
    patch: { status: "archived" },
  },
};

async function updateBillStatus(
  executor: DbExecutor,
  billId: string,
  requiredStatus: Bill["status"],
  patch: BillPatch
): Promise<void> {
  const [updated] = await executor
    .update(billsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(billsTable.id, billId), eq(billsTable.status, requiredStatus)))
    .returning({ id: billsTable.id });

  if (!updated) throw new Error("RACE_LOST");
}

async function handleBillAction(action: BillAction, bill: Bill): Promise<NextResponse | undefined> {
  const { requiredStatus, errorMessage, patch } = ACTION_CONFIG[action];

  if (bill.status !== requiredStatus)
    return NextResponse.json({ error: errorMessage }, { status: 400 });

  if (action === "approve") {
    await db.transaction(async (tx) => {
      await updateBillStatus(tx, bill.id, requiredStatus, patch);

      await tx.insert(paymentsTable).values({
        billId: bill.id,
        vendorId: bill.vendorId,
        amount: bill.amount,
        status: "scheduled",
        scheduledDate: bill.dueDate,
        paymentMethod: bill.paymentType,
      });
    });
    return;
  }

  await updateBillStatus(db, bill.id, requiredStatus, patch);
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

    const ownedBill = and(eq(billsTable.id, id), eq(billsTable.ownerId, user.id));
    const bill = await db.query.bills.findFirst({ where: ownedBill });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const actionError = await handleBillAction(action, bill);
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
