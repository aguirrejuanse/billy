import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { BillStatusBadge } from "./BillStatusBadge";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
import type { BillWithRelations } from "@/types";

type SelectionProps =
  | {
      onToggle: (id: string) => void;
      onSelectAll: () => void;
      onClear: () => void;
      selectedIds: Set<string>;
      allSelected: boolean;
      someSelected: boolean;
    }
  | {
      onToggle?: never;
      onSelectAll?: never;
      onClear?: never;
      selectedIds?: never;
      allSelected?: never;
      someSelected?: never;
    };

type BillsTableProps = {
  bills: BillWithRelations[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
} & SelectionProps;

interface BillsTableSkeletonProps {
  selectable?: boolean;
}

export function BillsTableSkeleton({ selectable = false }: BillsTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-16" />
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-10" />}
            <TableHead>Vendor</TableHead>
            <TableHead>Bill #</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-35">Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(6)].map((_, i) => (
            <TableRow key={i}>
              {selectable && (
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BillsTable({
  bills,
  isLoading,
  error,
  onRetry,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  allSelected,
  someSelected,
}: BillsTableProps) {
  const selectable = !!onToggle;

  if (isLoading) return <BillsTableSkeleton selectable={selectable} />;

  if (error) return <ErrorFallback message="Failed to load bills." onRetry={onRetry} />;

  function handleHeaderCheck() {
    if (!selectable) return;
    if (allSelected) onClear();
    else onSelectAll();
  }

  return (
    <div className="space-y-4" data-tour="bills-table">
      <p className="text-sm text-muted-foreground">{bills.length} bills</p>
      {bills.length === 0 ? (
        <EmptyState message="No bills found." />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                <TableRow>
                  {selectable && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onCheckedChange={handleHeaderCheck}
                        aria-label="Select all bills"
                      />
                    </TableHead>
                  )}
                  <TableHead>Vendor</TableHead>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-35">Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow
                    key={bill.id}
                    data-state={selectedIds?.has(bill.id) ? "selected" : undefined}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds?.has(bill.id) ?? false}
                          onCheckedChange={() => onToggle(bill.id)}
                          aria-label={`Select bill ${bill.number}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{bill.vendor?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {bill.number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {bill.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(bill.amount, bill.currency)}
                    </TableCell>
                    <TableCell>
                      <BillStatusBadge status={bill.status} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatDate(bill.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/bills/${bill.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
