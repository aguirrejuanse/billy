import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo-session")?.value === "true";
  if (isDemo) redirect("/bills");

  const { userId } = await auth();
  if (userId) redirect("/bills");

  return <>{children}</>;
}
