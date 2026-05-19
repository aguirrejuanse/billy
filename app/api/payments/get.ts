import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  payments as paymentsTable,
  bills as billsTable,
  vendors as vendorsTable,
  paymentStatusEnum,
  paymentMethodEnum,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidUuid } from "@/lib/utils";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const rawStatus = searchParams.get("status") ?? undefined;
    const rawMethod = searchParams.get("paymentMethod") ?? undefined;
    const vendorId = searchParams.get("vendorId") ?? undefined;

    const statusParsed =
      rawStatus !== undefined ? z.enum(paymentStatusEnum.enumValues).safeParse(rawStatus) : null;
    if (statusParsed && !statusParsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 422 });
    }

    const methodParsed =
      rawMethod !== undefined ? z.enum(paymentMethodEnum.enumValues).safeParse(rawMethod) : null;
    if (methodParsed && !methodParsed.success) {
      return NextResponse.json({ error: "Invalid paymentMethod value" }, { status: 422 });
    }

    if (vendorId !== undefined && !isValidUuid(vendorId)) {
      return NextResponse.json({ error: "Invalid vendorId" }, { status: 422 });
    }

    const status = statusParsed?.data;
    const paymentMethod = methodParsed?.data;

    const conditions = [eq(billsTable.ownerId, user.id)];
    if (status) conditions.push(eq(paymentsTable.status, status));
    if (paymentMethod) conditions.push(eq(paymentsTable.paymentMethod, paymentMethod));
    if (vendorId) conditions.push(eq(paymentsTable.vendorId, vendorId));

    const rows = await db
      .select()
      .from(paymentsTable)
      .innerJoin(billsTable, eq(paymentsTable.billId, billsTable.id))
      .innerJoin(vendorsTable, eq(paymentsTable.vendorId, vendorsTable.id))
      .where(and(...conditions))
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
