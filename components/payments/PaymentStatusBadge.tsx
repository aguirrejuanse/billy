import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { paymentStatusLabels } from "@/lib/formatters";
import type { Payment } from "@/types";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      scheduled: "[background:var(--status-scheduled-bg)] [color:var(--status-scheduled-fg)]",
      initiated: "[background:var(--status-initiated-bg)] [color:var(--status-initiated-fg)]",
      paid: "[background:var(--status-paid-bg)] [color:var(--status-paid-fg)]",
      failed: "[background:var(--status-failed-bg)] [color:var(--status-failed-fg)]",
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
