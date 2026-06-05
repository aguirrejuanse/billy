"use client";

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
import { formatCurrency, formatDate, paymentMethodLabels } from "@/lib/formatters";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentActionButton } from "./PaymentActionButton";
import type { PaymentWithRelations } from "@/types";

interface PaymentsTableProps {
  payments: PaymentWithRelations[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const COLUMNS = (
  <TableRow>
    <TableHead>Vendor</TableHead>
    <TableHead>Bill #</TableHead>
    <TableHead className="text-right">Amount</TableHead>
    <TableHead>Method</TableHead>
    <TableHead>Scheduled Date</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Actions</TableHead>
    <TableHead />
  </TableRow>
);

export function PaymentsTableSkeleton() {
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
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
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

export function PaymentsTable({ payments, isLoading, error, onRetry }: PaymentsTableProps) {
  if (isLoading) return <PaymentsTableSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">Failed to load payments.</p>
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{payments.length} payments</p>
      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No payments found.</div>
      ) : (
        <Table>
          <TableHeader>{COLUMNS}</TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.vendor.name}</TableCell>
                <TableCell className="font-mono text-xs">{payment.bill.number}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="text-sm">
                  {paymentMethodLabels[payment.paymentMethod]}
                </TableCell>
                <TableCell className="text-sm">{formatDate(payment.scheduledDate)}</TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <PaymentActionButton paymentId={payment.id} status={payment.status} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/bills/${payment.billId}`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Bill
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
