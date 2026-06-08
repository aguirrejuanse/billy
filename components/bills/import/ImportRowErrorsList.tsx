"use client";

import { type RowError } from "@/lib/import-validators";

interface ImportRowErrorsListProps {
  errors: RowError[];
}

export function ImportRowErrorsList({ errors }: ImportRowErrorsListProps) {
  return (
    <details className="rounded-md border border-destructive/20 bg-destructive/5">
      <summary className="cursor-pointer px-3 py-2 text-sm text-destructive font-medium">
        {errors.length} row{errors.length !== 1 ? "s" : ""} with errors (will be skipped)
      </summary>
      <div className="divide-y divide-destructive/10 px-3 pb-2">
        {errors.map(({ row, error }) => (
          <div key={row} className="py-1.5 text-xs">
            <span className="font-medium">Row {row}:</span> {error}
          </div>
        ))}
      </div>
    </details>
  );
}
