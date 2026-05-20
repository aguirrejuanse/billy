import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  vendorPaymentMethods as vendorPaymentMethodsTable,
  vendors as vendorsTable,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { createVendorSchema } from "@/lib/validators";

export const maxDuration = 30;

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

    const parsed = createVendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }

    const existing = await db.query.vendors.findFirst({
      where: and(eq(vendorsTable.name, parsed.data.name), eq(vendorsTable.ownerId, user.id)),
    });
    if (existing) {
      return NextResponse.json({ error: "Vendor name already exists" }, { status: 409 });
    }

    const { paymentMethods, ...vendorData } = parsed.data;

    const vendor = await db.transaction(async (tx) => {
      const [v] = await tx
        .insert(vendorsTable)
        .values({ ...vendorData, ownerId: user.id })
        .returning();

      await tx
        .insert(vendorPaymentMethodsTable)
        .values(paymentMethods.map((method) => ({ vendorId: v.id, method })));

      return { ...v, paymentMethods };
    });

    return NextResponse.json({ data: vendor }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/vendors]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
