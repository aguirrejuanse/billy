"use client";

import { useAgingReportQuery } from "@/hooks/useAgingReportQuery";
import {
  AgingSummaryCards,
  AgingSummaryCardsSkeleton,
} from "@/components/reports/AgingSummaryCards";
import { AgingTable, AgingTableSkeleton } from "@/components/reports/AgingTable";
import { AgingDistributionChart } from "@/components/reports/AgingDistributionChart";
import { AgingVendorChart } from "@/components/reports/AgingVendorChart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { agingToCsv, downloadCsv } from "@/lib/export-utils";
import { useDemoSession } from "@/hooks/useDemoSession";

const sectionTitle = "text-sm font-semibold text-muted-foreground uppercase tracking-wide";

export default function ReportsPage() {
  const { data, isLoading, isError, refetch, endDate, setEndDate } = useAgingReportQuery();
  const { user } = useDemoSession();

  if (isLoading) {
    return (
      <div className="space-y-6 h-full overflow-y-auto scrollbar-hide pb-6 px-0.5">
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
    <div className="space-y-6 h-full overflow-y-auto scrollbar-hide pb-6 px-0.5 pt-1">
      <ReportHeader
        endDate={endDate}
        onEndDateChange={setEndDate}
        onExport={() => {
          const username = user?.name?.toLowerCase().replace(/\s+/g, "-") ?? "export";
          downloadCsv(agingToCsv(data.rows), `${username}-${endDate}-billy-aging.csv`);
        }}
        exportDisabled={data.rows.length === 0}
      />

      <h2 className={sectionTitle}>AP Snapshot</h2>
      <AgingSummaryCards summary={data.summary} />

      <h2 className={sectionTitle}>Aging Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <AgingDistributionChart rows={data.rows} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <AgingVendorChart rows={data.rows} />
          </CardContent>
        </Card>
      </div>

      <h2 className={sectionTitle}>Vendor Detail</h2>
      <AgingTable rows={data.rows} />
    </div>
  );
}
