"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillActionMutation } from "@/hooks/useBillActionMutation";
import type { Bill, BillWithRelations } from "@/types";

interface BillActionsProps {
  bill: BillWithRelations;
  isFetching: boolean;
}

export function BillActions({ bill, isFetching }: BillActionsProps) {
  const { mutate, isPending } = useBillActionMutation(bill.id);

  const statusMessages: Record<Bill["status"], string> = {
    draft: "Submit to enable approval",
    approved: "This bill has been approved",
    rejected: "This bill has been rejected",
    archived: "This bill is archived",
    awaiting_approval: "",
  };

  if (isPending || isFetching) {
    return <Loader2 className="animate-spin text-muted-foreground" />;
  }

  if (bill.status !== "awaiting_approval") {
    return <p className="text-sm text-muted-foreground">{statusMessages[bill.status]}</p>;
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => mutate("approve")} disabled={isPending}>
        Approve
      </Button>
      <Button variant="destructive" onClick={() => mutate("reject")} disabled={isPending}>
        Reject
      </Button>
    </div>
  );
}
