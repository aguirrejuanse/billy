"use client";

import { useSearchParams } from "next/navigation";
import { usePaymentsQuery } from "@/hooks/usePaymentsQuery";
import { usePagination } from "@/hooks/usePagination";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilters } from "@/components/payments/PaymentsFilters";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function PaymentsPage() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? undefined;
  const paymentMethod = searchParams.get("paymentMethod") ?? undefined;
  const vendorId = searchParams.get("vendorId") ?? undefined;

  const {
    data: payments = [],
    isPlaceholderData,
    error,
    refetch,
  } = usePaymentsQuery({
    status,
    paymentMethod,
    vendorId,
  });

  const { page, setPage, totalPages, paginated } = usePagination<(typeof payments)[number]>(
    payments,
    15
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <PaymentsFilters />
      <div className="flex-1 min-h-0">
        <PaymentsTable
          payments={paginated}
          isLoading={isPlaceholderData}
          error={error}
          onRetry={refetch}
        />
      </div>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={payments.length}
        pageSize={15}
        onPageChange={setPage}
      />
    </div>
  );
}
