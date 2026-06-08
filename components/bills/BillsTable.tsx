import Link from "next/link";
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

export function BillsTableSkeleton({ selectable = false }: { selectable?: boolean }) {
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

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">Failed to load bills.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium underline underline-offset-4 cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  function handleHeaderCheck() {
    if (allSelected) {
      onClear?.();
    } else {
      onSelectAll?.();
    }
  }

  return (
    <div className="space-y-4" data-tour="bills-table">
      <p className="text-sm text-muted-foreground">{bills.length} bills</p>
      {bills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No bills found.</div>
      ) : (
        <Table>
          <TableHeader>
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
                <TableCell className="font-mono text-xs">{bill.number}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {bill.description ?? "—"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(bill.amount, bill.currency)}
                </TableCell>
                <TableCell>
                  <BillStatusBadge status={bill.status} />
                </TableCell>
                <TableCell className="text-sm">{formatDate(bill.dueDate)}</TableCell>
                <TableCell>
                  <Link
                    href={`/bills/${bill.id}`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Detail
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
