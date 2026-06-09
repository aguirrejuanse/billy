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
import { ImportBillsButton } from "@/components/bills/ImportBillsButton";
import { ExportBillsButton } from "@/components/bills/ExportBillsButton";
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

  const { page, setPage, totalPages, paginated, total } = usePagination<(typeof bills)[number]>(
    bills,
    15
  );

  const toggleCreateBill = () => setOpenCreateBill((prev) => !prev);

  useDemoTour({ isLoading: isPlaceholderData });

  const exportBills = selectedBills.length > 0 ? selectedBills : bills;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <BillsFilters />
          <div className="flex items-center gap-2">
            <ExportBillsButton
              bills={exportBills}
              selectionCount={selectedBills.length}
              disabled={isPlaceholderData}
            />
            <ImportBillsButton disabled={isPlaceholderData} />
            <Button onClick={toggleCreateBill} disabled={isPlaceholderData} data-tour="new-bill">
              New Bill
            </Button>
          </div>
        </div>
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
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
      <CreateBillSheet open={openCreateBill} onOpenChange={toggleCreateBill} />
    </>
  );
}
