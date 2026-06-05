"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { FileText, CreditCard, Building2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoSession } from "@/hooks/useDemoSession";
import { restartTour } from "@/hooks/useDemoTour";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isDemo, user, signOut } = useDemoSession();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen border-r bg-sidebar">
      <div className="h-14 px-6 flex items-center border-b">
        <span className="text-lg font-semibold tracking-tight">Billy</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            data-tour={href === "/reports" ? "sidebar-reports" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t">
        {isDemo ? (
          <div className="space-y-3">
            {pathname === "/bills" && (
              <button
                onClick={restartTour}
                className="w-full flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                ✦ Restart tour
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name ?? "Demo User"}</p>
                <Button variant="ghost" size="xs" onClick={signOut}>
                  Exit demo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <UserButton showName />
        )}
      </div>
    </aside>
  );
}
