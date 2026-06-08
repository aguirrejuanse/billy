"use client";

import { CheckCircleIcon } from "lucide-react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type ImportResult } from "@/lib/import-validators";

interface ImportResultStepProps {
  result: ImportResult;
  onClose: () => void;
}

export function ImportResultStep({ result, onClose }: ImportResultStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Import Complete</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircleIcon className="h-4 w-4 shrink-0" />
          {result.imported} bill{result.imported !== 1 ? "s" : ""} imported successfully.
        </div>

        {result.errors.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} failed during
              creation:
            </p>
            <div className="rounded-md border border-destructive/20 bg-destructive/5 divide-y divide-destructive/10">
              {result.errors.map(({ row, error }) => (
                <div key={row} className="px-3 py-1.5 text-xs">
                  <span className="font-medium">Row {row}:</span> {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  );
}
