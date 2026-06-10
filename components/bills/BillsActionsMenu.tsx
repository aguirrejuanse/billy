"use client";

import { useState } from "react";
import { DownloadIcon, UploadIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportBillsModal } from "@/components/bills/import/ImportBillsModal";
import { exportBillsCsv } from "@/lib/export-utils";
import { useDemoSession } from "@/hooks/useDemoSession";
import type { BillWithRelations } from "@/types";

interface BillsActionsMenuProps {
  bills?: BillWithRelations[];
  selectionCount?: number;
  disabled?: boolean;
}

export function BillsActionsMenu({ bills, selectionCount = 0, disabled }: BillsActionsMenuProps) {
  const [importOpen, setImportOpen] = useState(false);
  const { user } = useDemoSession();
  const isEmpty = !bills || bills.length === 0;

  function handleExport() {
    if (isEmpty) return;
    exportBillsCsv(bills, user?.name ?? "export");
  }

  const exportLabel = selectionCount > 0 ? `Export (${selectionCount})` : "Export CSV";

  return (
    <>
      {/* Desktop: original buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={disabled || isEmpty} onClick={handleExport}>
          <DownloadIcon className="h-4 w-4" />
          {exportLabel}
        </Button>
        <Button variant="outline" size="sm" disabled={disabled} onClick={() => setImportOpen(true)}>
          <UploadIcon className="h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Mobile: dropdown */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" disabled={disabled}>
              <ChevronDownIcon className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport} disabled={isEmpty}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              {exportLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <UploadIcon className="h-4 w-4 mr-2" />
              Import CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ImportBillsModal open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
