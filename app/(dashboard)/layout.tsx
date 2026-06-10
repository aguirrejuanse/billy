import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("demo-session")?.value === "true";

  if (!isDemo) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
