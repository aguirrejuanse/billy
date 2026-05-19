"use client";

import { useSearchParams } from "next/navigation";
import { usePaymentsQuery } from "@/hooks/usePaymentsQuery";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentsFilters } from "@/components/payments/PaymentsFilters";

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

  return (
    <div className="space-y-4">
      <PaymentsFilters />
      <PaymentsTable
        payments={payments}
        isLoading={isPlaceholderData}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
