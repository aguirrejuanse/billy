"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { billsToCsv, downloadCsv } from "@/lib/export-utils";
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
    const csv = billsToCsv(bills);
    const username = user?.name?.toLowerCase().replace(/\s+/g, "-") ?? "export";
    const date = new Date().toISOString().split("T")[0];
    downloadCsv(csv, `${username}-${date}-billy.csv`);
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled || isEmpty} onClick={handleExport}>
      <DownloadIcon className="h-4 w-4" />
      {label}
    </Button>
  );
}
