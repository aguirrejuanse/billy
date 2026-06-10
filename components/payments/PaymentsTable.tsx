"use client";

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
import { formatCurrency, formatDate, paymentMethodLabels } from "@/lib/formatters";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentActionButton } from "./PaymentActionButton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
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
    <TableHead className="hidden md:table-cell">Bill #</TableHead>
    <TableHead className="text-right">Amount</TableHead>
    <TableHead>Method</TableHead>
    <TableHead className="hidden md:table-cell">Scheduled Date</TableHead>
    <TableHead className="w-25">Status</TableHead>
    <TableHead className="w-30">Actions</TableHead>
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

  if (error) return <ErrorFallback message="Failed to load payments." onRetry={onRetry} />;

  return (
    <div className="flex flex-col h-full gap-4">
      <p className="text-sm text-muted-foreground">{payments.length} payments</p>
      {payments.length === 0 ? (
        <EmptyState message="No payments found." />
      ) : (
        <div className="rounded-lg border overflow-auto h-full scrollbar-hide">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
              {COLUMNS}
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{payment.vendor.name}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {payment.bill.number}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {paymentMethodLabels[payment.paymentMethod]}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm tabular-nums">
                    {formatDate(payment.scheduledDate)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentActionButton paymentId={payment.id} status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/bills/${payment.billId}`}
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
      )}
    </div>
  );
}
