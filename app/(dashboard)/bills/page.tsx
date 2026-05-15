"use client";

import { useBillsQuery } from "@/hooks/useBillsQuery";
import { BillsTable } from "@/components/bills/BillsTable";

export default function BillsPage() {
  const { data: bills, isLoading, error } = useBillsQuery();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading bills...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load bills. Please try again.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bills.length} bills</p>
      </div>
      <BillsTable bills={bills} />
    </div>
  );
}
