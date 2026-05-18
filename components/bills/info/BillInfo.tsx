import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/formatters";
import type { BillWithRelations } from "@/types";
import { Field } from "./Field";

const paymentMethodLabels: Record<string, string> = {
  ach: "ACH",
  wire: "Wire",
  check: "Check",
  card: "Card",
};

interface BillInfoProps {
  bill: BillWithRelations;
}

export function BillInfo({ bill }: BillInfoProps) {
  return (
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
  );
}
