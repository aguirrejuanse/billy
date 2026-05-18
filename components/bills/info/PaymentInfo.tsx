import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Payment } from "@/types";
import { Field } from "./Field";

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

interface PaymentInfoProps {
  payment: Payment;
  currency: string;
}

export function PaymentInfo({ payment, currency }: PaymentInfoProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Payment</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 border rounded-lg p-4">
        <Field label="Status" value={paymentStatusLabels[payment.status] ?? payment.status} />
        <Field
          label="Method"
          value={paymentMethodLabels[payment.paymentMethod] ?? payment.paymentMethod}
        />
        <Field label="Amount" value={formatCurrency(payment.amount, currency)} />
        <Field label="Scheduled Date" value={formatDate(payment.scheduledDate)} />
        {payment.paidAt && <Field label="Paid At" value={formatDate(payment.paidAt)} />}
        {payment.notes && <Field label="Notes" value={payment.notes} className="col-span-2" />}
      </div>
    </section>
  );
}
