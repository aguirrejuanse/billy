import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessibleVendorFilter } from "@/db/filters";
import { bills as billsTable, vendors as vendorsTable } from "@/db/schema";
import { createBillSchema } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";
import { createBillWithLineItems } from "@/lib/bill-queries";

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
      db.query.vendors.findFirst({
        where: and(eq(vendorsTable.id, parsed.data.vendorId), accessibleVendorFilter(user.id)),
      }),
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

    const bill = await createBillWithLineItems({ data: parsed.data, ownerId: user.id });

    return NextResponse.json({ data: bill }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/bills]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
