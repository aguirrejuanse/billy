"use client";

import { useState } from "react";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { usePagination } from "@/hooks/usePagination";
import { VendorsTable } from "@/components/vendors/VendorsTable";
import { CreateVendorSheet } from "@/components/vendors/CreateVendorSheet";
import { EditVendorSheet } from "@/components/vendors/EditVendorSheet";
import { PaginationBar } from "@/components/ui/pagination-bar";
import type { VendorWithMethods } from "@/types";

export default function VendorsPage() {
  const [openCreateVendor, setOpenCreateVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorWithMethods | null>(null);

  const { data: vendors = [], isLoading, error, refetch } = useVendorsQuery();

  const { page, setPage, totalPages, paginated, total } = usePagination<VendorWithMethods>(
    vendors,
    15
  );

  const toggleCreateVendor = () => setOpenCreateVendor((prev) => !prev);
  const closeEditVendor = () => setEditingVendor(null);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <button
            onClick={toggleCreateVendor}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            New Vendor
          </button>
        </div>
        <VendorsTable
          vendors={paginated}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          onEdit={setEditingVendor}
        />
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
      <CreateVendorSheet open={openCreateVendor} onOpenChange={toggleCreateVendor} />
      <EditVendorSheet vendor={editingVendor} onOpenChange={closeEditVendor} />
    </>
  );
}
