"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/bills": "Bills",
  "/payments": "Payments",
  "/vendors": "Vendors",
  "/reports": "AP Aging Report",
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const segment = "/" + pathname.split("/")[1];
  const title = pageTitles[segment] ?? "Billy";

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
      <ThemeToggle />
    </header>
  );
}
