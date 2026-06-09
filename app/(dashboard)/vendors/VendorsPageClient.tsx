"use client";

import { useState } from "react";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { usePagination } from "@/hooks/usePagination";
import { VendorsTable } from "@/components/vendors/VendorsTable";
import { CreateVendorSheet } from "@/components/vendors/CreateVendorSheet";
import { EditVendorSheet } from "@/components/vendors/EditVendorSheet";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Button } from "@/components/ui/button";
import type { VendorWithMethods } from "@/types";

export default function VendorsPage() {
  const [openCreateVendor, setOpenCreateVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorWithMethods | null>(null);

  const { data: vendors = [], isLoading, error, refetch } = useVendorsQuery();

  const { page, setPage, totalPages, paginated } = usePagination<VendorWithMethods>(vendors, 15);

  const toggleCreateVendor = () => setOpenCreateVendor((prev) => !prev);
  const closeEditVendor = () => setEditingVendor(null);

  return (
    <>
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center justify-end">
          <Button onClick={toggleCreateVendor}>New Vendor</Button>
        </div>
        <div className="flex-1 min-h-0">
          <VendorsTable
            vendors={paginated}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            onEdit={setEditingVendor}
          />
        </div>
        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={vendors.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
      <CreateVendorSheet open={openCreateVendor} onOpenChange={toggleCreateVendor} />
      <EditVendorSheet vendor={editingVendor} onOpenChange={closeEditVendor} />
    </>
  );
}
