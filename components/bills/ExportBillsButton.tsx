"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBillsCsv } from "@/lib/export-utils";
import { useDemoSession } from "@/hooks/useDemoSession";
import type { BillWithRelations } from "@/types";

interface ExportBillsButtonProps {
  bills?: BillWithRelations[];
  selectionCount?: number;
  disabled?: boolean;
}

export function ExportBillsButton({ bills, selectionCount = 0, disabled }: ExportBillsButtonProps) {
  const { user } = useDemoSession();
  const isEmpty = !bills || bills.length === 0;
  const label = selectionCount > 0 ? `Export (${selectionCount})` : "Export CSV";

  function handleExport() {
    if (isEmpty) return;
    exportBillsCsv(bills, user?.name ?? "export");
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled || isEmpty} onClick={handleExport}>
      <DownloadIcon className="h-4 w-4" />
      {label}
    </Button>
  );
}
