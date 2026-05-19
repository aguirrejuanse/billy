import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  vendorPaymentMethods as vendorPaymentMethodsTable,
  vendors as vendorsTable,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateVendorSchema } from "@/lib/validators";
import { isValidUuid } from "@/lib/utils";

export const maxDuration = 30;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const { id } = await params;
    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid vendor id" }, { status: 422 });
    }

    const vendor = await db.query.vendors.findFirst({
      where: eq(vendorsTable.id, id),
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.ownerId === null) {
      return NextResponse.json({ error: "Cannot edit a global vendor" }, { status: 403 });
    }

    if (vendor.ownerId !== user.id) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const parsed = updateVendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }

    const { paymentMethods, ...vendorData } = parsed.data;

    const updated = await db.transaction(async (tx) => {
      const [v] = await tx
        .update(vendorsTable)
        .set({ ...vendorData, updatedAt: new Date() })
        .where(and(eq(vendorsTable.id, id), eq(vendorsTable.ownerId, user.id)))
        .returning();

      if (paymentMethods) {
        await tx
          .delete(vendorPaymentMethodsTable)
          .where(eq(vendorPaymentMethodsTable.vendorId, id));
        await tx
          .insert(vendorPaymentMethodsTable)
          .values(paymentMethods.map((method) => ({ vendorId: id, method })));
      }

      const methods = await tx.query.vendorPaymentMethods.findMany({
        where: eq(vendorPaymentMethodsTable.vendorId, id),
      });

      return { ...v, paymentMethods: methods.map((pm) => pm.method) };
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[PATCH /api/vendors/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
