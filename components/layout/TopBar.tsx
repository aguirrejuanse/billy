"use client";

import { usePathname } from "next/navigation";

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
    <header className="h-14 border-b bg-slate-50 flex items-center px-6">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
