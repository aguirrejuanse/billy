"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const close = () => setSidebarOpen(false);
    const open = () => setSidebarOpen(true);
    window.addEventListener("billy:close-sidebar", close);
    window.addEventListener("billy:open-sidebar", open);
    return () => {
      window.removeEventListener("billy:close-sidebar", close);
      window.removeEventListener("billy:open-sidebar", open);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 overflow-hidden"
          data-sidebar-sheet
          style={{ width: "14rem", maxWidth: "14rem" }}
        >
          <Sidebar onNavClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 overflow-hidden bg-background min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-hidden p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
