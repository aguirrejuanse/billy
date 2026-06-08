import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accessibleVendorFilter } from "@/db/filters";
import {
  bills as billsTable,
  vendors as vendorsTable,
  vendorPaymentMethods as vendorPaymentMethodsTable,
} from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";
import { createBillWithLineItems } from "@/lib/bill-queries";
import { importBillRowSchema, type ImportBillRow, type RowError } from "@/lib/import-validators";

export const maxDuration = 30;

const createImportBodySchema = z.object({
  rows: z.array(importBillRowSchema).min(1).max(50),
});

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

    const parsed = createImportBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 422 }
      );
    }

    const rows: ImportBillRow[] = parsed.data.rows;
    let imported = 0;
    const errors: RowError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // skip header

      try {
        const existingBill = await db.query.bills.findFirst({
          where: and(eq(billsTable.number, row.number), eq(billsTable.ownerId, user.id)),
        });
        if (existingBill) {
          errors.push({ row: rowNumber, error: `Bill number "${row.number}" already exists` });
          continue;
        }

        const existingVendor = await db.query.vendors.findFirst({
          where: and(
            sql`lower(${vendorsTable.name}) = lower(${row.vendor_name})`,
            accessibleVendorFilter(user.id)
          ),
          orderBy: (v, { sql: orderSql }) => [
            orderSql`CASE WHEN ${v.ownerId} IS NULL THEN 1 ELSE 0 END`,
          ],
          with: { paymentMethods: true },
        });

        let vendorId: string;

        if (!existingVendor) {
          const newVendor = await db.transaction(async (tx) => {
            const [v] = await tx
              .insert(vendorsTable)
              .values({ name: row.vendor_name, ownerId: user.id })
              .returning();
            await tx
              .insert(vendorPaymentMethodsTable)
              .values({ vendorId: v.id, method: row.payment_type });
            return v;
          });
          vendorId = newVendor.id;
        } else {
          vendorId = existingVendor.id;
          if (existingVendor.ownerId !== null) {
            // Private vendor — add payment method if missing
            const hasMethod = existingVendor.paymentMethods.some(
              (pm) => pm.method === row.payment_type
            );
            if (!hasMethod) {
              await db
                .insert(vendorPaymentMethodsTable)
                .values({ vendorId: existingVendor.id, method: row.payment_type });
            }
          }
          // Global vendor (ownerId IS NULL) — read-only, skip payment method insert
        }

        await createBillWithLineItems({
          data: {
            vendorId,
            number: row.number,
            amount: row.amount,
            currency: row.currency,
            invoiceDate: row.invoice_date,
            dueDate: row.due_date,
            description: row.description,
            paymentType: row.payment_type,
            lineItems: [],
          },
          ownerId: user.id,
        });

        imported++;
      } catch (rowErr) {
        // eslint-disable-next-line no-console
        console.error(`[POST /api/bills/import/create] row ${rowNumber}`, rowErr);
        errors.push({ row: rowNumber, error: "Failed to create bill" });
      }
    }

    return NextResponse.json({ data: { imported, errors } }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/bills/import/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
