import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { accessibleVendorFilter } from "@/db/filters";
import { vendors as vendorsTable } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const result = await db.query.vendors.findMany({
      where: accessibleVendorFilter(user.id),
      orderBy: [asc(vendorsTable.name)],
      with: { paymentMethods: true },
    });

    const data = result.map((v) => ({
      ...v,
      paymentMethods: v.paymentMethods.map((pm) => pm.method),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/vendors]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
