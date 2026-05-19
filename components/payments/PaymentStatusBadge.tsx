import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { paymentStatusLabels } from "@/lib/formatters";
import type { Payment } from "@/types";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      scheduled: "bg-blue-100 text-blue-800",
      initiated: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    },
  },
});

interface PaymentStatusBadgeProps {
  status: Payment["status"];
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)}>{paymentStatusLabels[status]}</span>
  );
}
