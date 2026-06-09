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
      <div className="h-14 px-6 flex items-center gap-2 border-b border-sidebar-border">
        <div className="size-6 rounded bg-sidebar-primary flex items-center justify-center">
          <span className="text-xs font-bold text-sidebar-primary-foreground">B</span>
        </div>
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          Billy
        </span>
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
                ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        {isDemo ? (
          <div className="space-y-3">
            {pathname === "/bills" && (
              <Button
                variant="outline"
                size="sm"
                onClick={restartTour}
                className="w-full border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 hover:text-sidebar-primary"
              >
                ✦ Restart tour
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-medium text-sidebar-primary-foreground shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name ?? "Demo User"}
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={signOut}
                  className="text-sidebar-foreground/50 hover:text-sidebar-foreground h-auto p-0 text-xs"
                >
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
