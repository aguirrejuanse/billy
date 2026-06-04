import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  if (!process.env.DEMO_CLERK_ID) {
    return NextResponse.json({ error: "Demo not configured" }, { status: 503 });
  }

  const cookieStore = await cookies();
  cookieStore.set("demo-session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return new NextResponse(null, { status: 204 });
}
