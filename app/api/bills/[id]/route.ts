import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bills as billsTable, payments as paymentsTable } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { billActionSchema } from "@/lib/validators";
import { BillDetailParams } from "@/types";

export const maxDuration = 30;

type RouteParams = { params: Promise<BillDetailParams> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    const validId = z.uuid().safeParse(id).success;
    if (!validId) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    const ownedBill = and(eq(billsTable.id, id), eq(billsTable.ownerId, user.id));

    const bill = await db.query.bills.findFirst({
      where: ownedBill,
      with: {
        vendor: true,
        lineItems: true,
        payment: true,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ data: bill });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/bills/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    const validId = z.uuid().safeParse(id).success;
    if (!validId) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = billActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }
    const { action } = parsed.data;

    const ownedBill = and(eq(billsTable.id, id), eq(billsTable.ownerId, user.id));
    const bill = await db.query.bills.findFirst({
      where: ownedBill,
      with: { vendor: true, lineItems: true, payment: true },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (bill.status !== "awaiting_approval") {
        return NextResponse.json(
          { error: "Bill cannot be approved in current status" },
          { status: 400 }
        );
      }
      await db.transaction(async (tx) => {
        await tx
          .update(billsTable)
          .set({ status: "approved", updatedAt: new Date() })
          .where(ownedBill);
        await tx.insert(paymentsTable).values({
          billId: bill.id,
          vendorId: bill.vendorId,
          amount: bill.amount,
          status: "scheduled",
          scheduledDate: bill.dueDate,
          paymentMethod: bill.paymentType,
        });
      });
    } else if (action === "reject") {
      if (bill.status !== "awaiting_approval") {
        return NextResponse.json(
          { error: "Bill cannot be rejected in current status" },
          { status: 400 }
        );
      }
      await db
        .update(billsTable)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(ownedBill);
    } else {
      return NextResponse.json({ error: "Action not supported" }, { status: 400 });
    }

    const updated = await db.query.bills.findFirst({
      where: ownedBill,
      with: { vendor: true, lineItems: true, payment: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PATCH /api/bills/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
