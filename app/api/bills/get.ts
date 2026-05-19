import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bills as billsTable, billStatusEnum } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidUuid } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const rawStatus = searchParams.get("status") ?? undefined;
    const vendorId = searchParams.get("vendorId") ?? undefined;

    const statusParsed =
      rawStatus !== undefined ? z.enum(billStatusEnum.enumValues).safeParse(rawStatus) : null;
    if (statusParsed && !statusParsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 422 });
    }
    const status = statusParsed?.data;

    if (vendorId !== undefined && !isValidUuid(vendorId)) {
      return NextResponse.json({ error: "Invalid vendorId" }, { status: 422 });
    }

    const conditions = [eq(billsTable.ownerId, user.id)];
    if (status) conditions.push(eq(billsTable.status, status));
    if (vendorId) conditions.push(eq(billsTable.vendorId, vendorId));

    const bills = await db.query.bills.findMany({
      where: and(...conditions),
      with: { vendor: true, lineItems: true, payment: true },
      orderBy: (bills, { desc }) => [desc(bills.createdAt)],
    });

    return NextResponse.json({ data: bills });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/bills]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
