"use client";

import { useState } from "react";
import { DownloadIcon, UploadIcon, ChevronDownIcon } from "lucide-react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineError } from "./InlineError";

const COLUMN_DOCS: [string, boolean, string][] = [
  ["vendor_name", true, "Auto-created if not found"],
  ["number", true, "Unique per account"],
  ["amount", true, "Positive number (e.g. 1500.00)"],
  ["currency", false, "USD / EUR / ARS — default USD"],
  ["invoice_date", true, "YYYY-MM-DD"],
  ["due_date", true, "YYYY-MM-DD, must be ≥ invoice_date"],
  ["description", false, "Optional free text"],
  ["payment_type", true, "ach / wire / check / card"],
];

interface ImportUploadStepProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  parseError: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export function ImportUploadStep({
  inputRef,
  parseError,
  onFileChange,
  onClose,
}: ImportUploadStepProps) {
  const [showUpload, setShowUpload] = useState(false);

  function showUploadStep() {
    setShowUpload(true);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Import Bills from CSV</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        <div className="rounded-xl border-2 border-dashed overflow-hidden">
          <div className="px-6 py-5 flex flex-col items-center gap-3 text-center">
            {!showUpload ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Download the template, fill in the fields, then upload it.
                </p>
                <a href="/sample-bills.csv" download onClick={showUploadStep}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <DownloadIcon className="h-4 w-4" />
                    Download template
                  </Button>
                </a>
                <button
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground cursor-pointer"
                  onClick={showUploadStep}
                >
                  Already have a file? Upload directly
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload your completed .csv file. Max 50 rows, 10 MB.
                </p>
                <Button size="sm" className="gap-2" onClick={() => inputRef.current?.click()}>
                  <UploadIcon className="h-4 w-4" />
                  Choose CSV file
                </Button>
              </>
            )}
          </div>
        </div>

        <details className="group rounded-lg border bg-muted/20" open>
          <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            Column reference
            <ChevronDownIcon className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t px-3 pb-2 pt-1 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] gap-x-3 text-muted-foreground font-medium uppercase tracking-wide text-[10px] pb-1 border-b">
              <span>Column</span>
              <span>Required</span>
              <span>Notes</span>
            </div>
            {COLUMN_DOCS.map(([col, required, note]) => (
              <div key={col} className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] gap-x-3">
                <span className="truncate text-foreground">{col}</span>
                <span className={required ? "text-foreground" : "text-muted-foreground"}>
                  {required ? "yes" : "no"}
                </span>
                <span className="text-muted-foreground">{note}</span>
              </div>
            ))}
          </div>
        </details>

        {parseError && <InlineError message={parseError} />}
      </div>

      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
