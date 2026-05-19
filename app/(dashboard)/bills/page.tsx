"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBillsQuery } from "@/hooks/useBillsQuery";
import { BillsTable } from "@/components/bills/BillsTable";
import { BillsFilters } from "@/components/bills/BillsFilters";
import { CreateBillSheet } from "@/components/bills/CreateBillSheet";

export default function BillsPage() {
  const [openCreateBill, setOpenCreateBill] = useState(false);
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? undefined;
  const vendorId = searchParams.get("vendorId") ?? undefined;

  const {
    data: bills = [],
    isPlaceholderData,
    error,
    refetch,
  } = useBillsQuery({ status, vendorId });

  const toggleCreateBill = () => setOpenCreateBill((prev) => !prev);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BillsFilters />
          <button
            onClick={toggleCreateBill}
            disabled={isPlaceholderData}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            New Bill
          </button>
        </div>
        <BillsTable bills={bills} isLoading={isPlaceholderData} error={error} onRetry={refetch} />
      </div>
      <CreateBillSheet open={openCreateBill} onOpenChange={toggleCreateBill} />
    </>
  );
}
