"use client";

import { useAgingReportQuery } from "@/hooks/useAgingReportQuery";
import {
  AgingSummaryCards,
  AgingSummaryCardsSkeleton,
} from "@/components/reports/AgingSummaryCards";
import { AgingTable, AgingTableSkeleton } from "@/components/reports/AgingTable";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const { data, isLoading, isError, refetch } = useAgingReportQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AgingSummaryCardsSkeleton />
        <AgingTableSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">Failed to load aging report.</p>
        <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <AgingSummaryCards summary={data.summary} />
      <AgingTable rows={data.rows} />
    </div>
  );
}
