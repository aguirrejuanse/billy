import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bills as billsTable,
  billLineItems as billLineItemsTable,
  vendors as vendorsTable,
} from "@/db/schema";
import { createBillSchema } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const parsed = createBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }

    const [vendor, existingBill] = await Promise.all([
      db.query.vendors.findFirst({ where: eq(vendorsTable.id, parsed.data.vendorId) }),
      db.query.bills.findFirst({
        where: and(eq(billsTable.number, parsed.data.number), eq(billsTable.ownerId, user.id)),
      }),
    ]);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 422 });
    }
    if (existingBill) {
      return NextResponse.json({ error: "Bill number already exists" }, { status: 409 });
    }

    const { lineItems, amount, ...billData } = parsed.data;

    const bill = await db.transaction(async (tx) => {
      const [newBill] = await tx
        .insert(billsTable)
        .values({ ...billData, amount: String(amount), ownerId: user.id })
        .returning();

      if (lineItems?.length) {
        await tx
          .insert(billLineItemsTable)
          .values(
            lineItems.map((item) => ({ ...item, amount: String(item.amount), billId: newBill.id }))
          );
      }

      return newBill;
    });

    return NextResponse.json({ data: bill }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/bills]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
