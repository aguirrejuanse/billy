import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const maxDuration = 30;

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("demo-session");
  return new NextResponse(null, { status: 204 });
}
