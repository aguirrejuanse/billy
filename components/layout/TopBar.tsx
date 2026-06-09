"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const pageTitles: Record<string, string> = {
  "/bills": "Bills",
  "/payments": "Payments",
  "/vendors": "Vendors",
  "/reports": "AP Aging Report",
};

export function TopBar() {
  const pathname = usePathname();
  const segment = "/" + pathname.split("/")[1];
  const title = pageTitles[segment] ?? "Billy";

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
