import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { User } from "@/types";

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

export async function getAuthenticatedUser(): Promise<AuthSuccess | AuthFailure> {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo-session")?.value === "true";
  const demoClerkId = process.env.DEMO_CLERK_ID;

  const clerkId = isDemo && demoClerkId ? demoClerkId : (await auth()).userId;

  if (!clerkId) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || email;

    const [inserted] = await db
      .insert(users)
      .values({ clerkId, name, email })
      .onConflictDoNothing()
      .returning();

    // onConflictDoNothing returns nothing on race condition — refetch
    user =
      inserted ?? (await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })) ?? null;

    if (!user) {
      return { user: null, error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
    }
  }

  return { user, error: null };
}
