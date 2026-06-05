import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export const maxDuration = 30;

export async function GET() {
  try {
    const { user, isDemo, error } = await getAuthenticatedUser();
    if (error) return error;

    return NextResponse.json({ data: { name: user.name, email: user.email, isDemo } });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
