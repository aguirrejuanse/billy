"use client";

import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { InlineError } from "./InlineError";
import { ImportValidRowsTable } from "./ImportValidRowsTable";
import { ImportRowErrorsList } from "./ImportRowErrorsList";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ImportBillRow, type RowError } from "@/lib/import-validators";

interface ImportPreviewStepProps {
  validRows: ImportBillRow[];
  rowErrors: RowError[];
  isPending: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  onImport: () => void;
  onBack: () => void;
}

export function ImportPreviewStep({
  validRows,
  rowErrors,
  isPending,
  isError,
  errorMessage,
  onImport,
  onBack,
}: ImportPreviewStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Preview Import</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-status-success-fg">
            <CheckCircleIcon className="h-4 w-4" />
            {validRows.length} row{validRows.length !== 1 ? "s" : ""} valid
          </span>
          {rowErrors.length > 0 && (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertCircleIcon className="h-4 w-4" />
              {rowErrors.length} error{rowErrors.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {validRows.length > 0 && <ImportValidRowsTable rows={validRows} />}
        {rowErrors.length > 0 && <ImportRowErrorsList errors={rowErrors} />}
        {isError && <InlineError message={errorMessage ?? "Import failed"} />}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={validRows.length === 0 || isPending} onClick={onImport}>
          {isPending
            ? "Importing…"
            : `Import ${validRows.length} bill${validRows.length !== 1 ? "s" : ""}`}
        </Button>
      </DialogFooter>
    </>
  );
}
