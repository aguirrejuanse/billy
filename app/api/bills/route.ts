import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, bills as billsTable } from "@/db/schema";

export async function GET(_request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bills = await db.query.bills.findMany({
      where: eq(billsTable.ownerId, user.id),
      with: {
        vendor: true,
        owner: true,
        lineItems: true,
        payment: true,
      },
      orderBy: (bills, { desc }) => [desc(bills.createdAt)],
    });

    return NextResponse.json({ data: bills });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/bills]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
