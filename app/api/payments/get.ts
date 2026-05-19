import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  payments as paymentsTable,
  bills as billsTable,
  vendors as vendorsTable,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const rows = await db
      .select()
      .from(paymentsTable)
      .innerJoin(billsTable, eq(paymentsTable.billId, billsTable.id))
      .innerJoin(vendorsTable, eq(paymentsTable.vendorId, vendorsTable.id))
      .where(eq(billsTable.ownerId, user.id))
      .orderBy(desc(paymentsTable.scheduledDate));

    const payments = rows.map(({ payments, bills, vendors }) => ({
      ...payments,
      bill: bills,
      vendor: vendors,
    }));

    return NextResponse.json({ data: payments });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/payments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
