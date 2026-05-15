import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { User } from "@/types";

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

export async function getAuthenticatedUser(): Promise<AuthSuccess | AuthFailure> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { user, error: null };
}
