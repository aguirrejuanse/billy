import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo-session")?.value === "true";
  if (isDemo) redirect("/bills");

  const { userId } = await auth();
  redirect(userId ? "/bills" : "/sign-in");
}
