"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBillsQuery } from "@/hooks/useBillsQuery";
import { useBillSelection } from "@/hooks/useBillSelection";
import { useDemoTour } from "@/hooks/useDemoTour";
import { usePagination } from "@/hooks/usePagination";
import { BillsTable } from "@/components/bills/BillsTable";
import { BillsFilters } from "@/components/bills/BillsFilters";
import { CreateBillSheet } from "@/components/bills/CreateBillSheet";
import { BillsActionsMenu } from "@/components/bills/BillsActionsMenu";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Button } from "@/components/ui/button";

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

  const { selectedIds, selectedBills, toggle, selectAll, clear, allSelected, someSelected } =
    useBillSelection(bills);

  const { page, setPage, totalPages, paginated } = usePagination<(typeof bills)[number]>(bills, 15);

  const toggleCreateBill = () => setOpenCreateBill((prev) => !prev);

  useDemoTour({ isLoading: isPlaceholderData });

  const exportBills = selectedBills.length > 0 ? selectedBills : bills;

  return (
    <>
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <BillsFilters />
          <div className="flex items-center gap-2">
            <BillsActionsMenu
              bills={exportBills}
              selectionCount={selectedBills.length}
              disabled={isPlaceholderData}
            />
            <Button onClick={toggleCreateBill} disabled={isPlaceholderData} data-tour="new-bill">
              New Bill
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <BillsTable
            bills={paginated}
            isLoading={isPlaceholderData}
            error={error}
            onRetry={refetch}
            selectedIds={selectedIds}
            onToggle={toggle}
            onSelectAll={selectAll}
            onClear={clear}
            allSelected={allSelected}
            someSelected={someSelected}
          />
        </div>
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={bills.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
      <CreateBillSheet open={openCreateBill} onOpenChange={toggleCreateBill} />
    </>
  );
}
