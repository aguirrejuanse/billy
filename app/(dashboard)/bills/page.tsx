"use client";

import { useState } from "react";
import { useBillsQuery } from "@/hooks/useBillsQuery";
import { BillsTable, BillsTableSkeleton } from "@/components/bills/BillsTable";
import { CreateBillSheet } from "@/components/bills/CreateBillSheet";

export default function BillsPage() {
  const [openCreateBill, setOpenCreateBill] = useState(false);
  const { data: bills, isPlaceholderData, error, refetch } = useBillsQuery();

  const toggleCreateBill = () => setOpenCreateBill((prev) => !prev);

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
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{bills?.length ?? 0} bills</p>
          <button
            onClick={toggleCreateBill}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            New Bill
          </button>
        </div>
        <BillsTable bills={bills ?? []} />
      </div>
      <CreateBillSheet open={openCreateBill} onOpenChange={toggleCreateBill} />
    </>
  );
}
