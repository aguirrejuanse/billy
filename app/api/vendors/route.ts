import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET() {
  try {
    const { error } = await getAuthenticatedUser();
    if (error) return error;

    const result = await db.query.vendors.findMany({
      orderBy: [asc(vendors.name)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/vendors]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
