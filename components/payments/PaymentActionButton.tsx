"use client";

import { Button } from "@/components/ui/button";
import { paymentActionConfig } from "@/lib/formatters";
import { usePaymentActionMutation } from "@/hooks/usePaymentActionMutation";
import type { Payment } from "@/db/schema";

interface PaymentActionButtonProps {
  paymentId: string;
  status: Payment["status"];
}

export function PaymentActionButton({ paymentId, status }: PaymentActionButtonProps) {
  const { mutate, isPending } = usePaymentActionMutation(paymentId);
  const entry = paymentActionConfig[status];

  if (!entry) return null;

  return (
    <Button
      size="sm"
      variant={entry.variant}
      disabled={isPending}
      onClick={() => mutate(entry.action)}
    >
      {isPending ? "Saving..." : entry.label}
    </Button>
  );
}
