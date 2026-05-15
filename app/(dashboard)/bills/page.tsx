"use client";

import { useBillsQuery } from "@/hooks/useBillsQuery";
import { BillsTable, BillsTableSkeleton } from "@/components/bills/BillsTable";

export default function BillsPage() {
  const { data: bills, isPlaceholderData, error, refetch } = useBillsQuery();

  if (isPlaceholderData) {
    return <BillsTableSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">Failed to load bills.</p>
        <button
          onClick={() => refetch()}
          className="text-sm font-medium underline underline-offset-4 cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bills?.length ?? 0} bills</p>
      </div>
      <BillsTable bills={bills ?? []} />
    </div>
  );
}
