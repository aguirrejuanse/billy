"use client";

import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/formatters";
import { BillStatusBadge } from "./BillStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BillWithRelations } from "@/types";

const paymentMethodLabels: Record<string, string> = {
  ach: "ACH",
  wire: "Wire",
  check: "Check",
  card: "Card",
};

const paymentStatusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  initiated: "Initiated",
  paid: "Paid",
  failed: "Failed",
};

interface BillDetailProps {
  bill: BillWithRelations;
  onBack: () => void;
}

export function BillDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-5 w-20" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillDetail({ bill, onBack }: BillDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        ← Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{bill.number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bill.vendor?.name ?? "Unknown vendor"}
          </p>
        </div>
        <BillStatusBadge status={bill.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 border rounded-lg p-4">
        <Field label="Amount" value={formatCurrency(bill.amount, bill.currency)} />
        <Field label="Currency" value={bill.currency} />
        <Field label="Invoice Date" value={formatDate(bill.invoiceDate)} />
        <Field
          label="Due Date"
          value={`${formatDate(bill.dueDate)} · ${formatRelativeDate(bill.dueDate)}`}
        />
        <Field
          label="Payment Type"
          value={paymentMethodLabels[bill.paymentType] ?? bill.paymentType}
        />
        {bill.description && (
          <Field label="Description" value={bill.description} className="col-span-2" />
        )}
      </div>

      {bill.payment && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Payment</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 border rounded-lg p-4">
            <Field
              label="Status"
              value={paymentStatusLabels[bill.payment.status] ?? bill.payment.status}
            />
            <Field
              label="Method"
              value={paymentMethodLabels[bill.payment.paymentMethod] ?? bill.payment.paymentMethod}
            />
            <Field label="Amount" value={formatCurrency(bill.payment.amount, bill.currency)} />
            <Field label="Scheduled Date" value={formatDate(bill.payment.scheduledDate)} />
            {bill.payment.paidAt && (
              <Field label="Paid At" value={formatDate(bill.payment.paidAt)} />
            )}
            {bill.payment.notes && (
              <Field label="Notes" value={bill.payment.notes} className="col-span-2" />
            )}
          </div>
        </section>
      )}

      {bill.lineItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Line Items</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.accountCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.amount, bill.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  className?: string;
}

function Field({ label, value, className }: FieldProps) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
