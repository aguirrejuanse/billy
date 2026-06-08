"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { billsToCsv, downloadCsv } from "@/lib/export-utils";
import type { BillWithRelations } from "@/types";

interface ExportBillsButtonProps {
  bills?: BillWithRelations[];
  disabled?: boolean;
}

export function ExportBillsButton({ bills, disabled }: ExportBillsButtonProps) {
  const isEmpty = !bills || bills.length === 0;

  function handleExport() {
    if (isEmpty) return;
    const csv = billsToCsv(bills);
    downloadCsv(csv, "bills-export.csv");
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled || isEmpty} onClick={handleExport}>
      <DownloadIcon className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
