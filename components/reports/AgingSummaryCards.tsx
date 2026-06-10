import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { StatCard } from "@/components/reports/info/StatCard";
import type { AgingSummary } from "@/types";

interface AgingSummaryCardsProps {
  summary: AgingSummary;
}

export function AgingSummaryCards({ summary }: AgingSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Total Outstanding" value={formatCurrency(summary.totalOutstanding)} />
      <StatCard
        label="Total Overdue"
        value={formatCurrency(summary.totalOverdue)}
        valueClassName="text-destructive"
        description={
          summary.totalOutstanding > 0
            ? `${((summary.totalOverdue / summary.totalOutstanding) * 100).toFixed(1)}% of total outstanding`
            : undefined
        }
      />
      <StatCard
        label="Bills Overdue"
        value={summary.overdueBillCount}
        description="open bills past due date"
      />
    </div>
  );
}

export function AgingSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
