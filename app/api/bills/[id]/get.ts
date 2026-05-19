import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { bills as billsTable } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidUuid } from "@/lib/utils";
import { BillDetailParams } from "@/types";

type RouteParams = { params: Promise<BillDetailParams> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const bill = await db.query.bills.findFirst({
      where: and(eq(billsTable.id, id), eq(billsTable.ownerId, user.id)),
      with: { vendor: true, lineItems: true, payment: true },
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
