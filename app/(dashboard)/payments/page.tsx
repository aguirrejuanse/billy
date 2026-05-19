"use client";

import { usePaymentsQuery } from "@/hooks/usePaymentsQuery";
import { PaymentsTable } from "@/components/payments/PaymentsTable";

export default function PaymentsPage() {
  const { data: payments = [], isPlaceholderData, error, refetch } = usePaymentsQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Payments</h1>
      </div>
      <PaymentsTable
        payments={payments}
        isLoading={isPlaceholderData}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}
