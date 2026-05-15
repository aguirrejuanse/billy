import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bills as billsTable, billLineItems as billLineItemsTable } from "@/db/schema";
import { createBillSchema } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET(_request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const bills = await db.query.bills.findMany({
      where: eq(billsTable.ownerId, user.id),
      with: {
        vendor: true,
        lineItems: true,
        payment: true,
      },
      orderBy: (bills, { desc }) => [desc(bills.createdAt)],
    });

    return NextResponse.json({ data: bills });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/bills]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const parsed = createBillSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
    }

    const { lineItems, amount, ...billData } = parsed.data;

    const bill = await db.transaction(async (tx) => {
      const [newBill] = await tx
        .insert(billsTable)
        .values({ ...billData, amount: String(amount), ownerId: user.id, status: "draft" })
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
