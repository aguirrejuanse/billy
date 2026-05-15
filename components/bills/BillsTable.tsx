import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { BillStatusBadge } from "./BillStatusBadge";
import type { BillWithRelations } from "@/types";

interface BillsTableProps {
  bills: BillWithRelations[];
}

const COLUMNS = (
  <TableRow>
    <TableHead>Vendor</TableHead>
    <TableHead>Bill #</TableHead>
    <TableHead>Description</TableHead>
    <TableHead className="text-right">Amount</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Due Date</TableHead>
  </TableRow>
);

export function BillsTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-16" />
      <Table>
        <TableHeader>{COLUMNS}</TableHeader>
        <TableBody>
          {[...Array(6)].map((_, i) => (
            <TableRow key={i}>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BillsTable({ bills }: BillsTableProps) {
  if (bills.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No bills found.</div>;
  }

  return (
    <Table>
      <TableHeader>{COLUMNS}</TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.id}>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
