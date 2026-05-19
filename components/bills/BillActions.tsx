"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillActionMutation } from "@/hooks/useBillActionMutation";
import type { BillWithRelations } from "@/types";

const statusMessages: Partial<Record<BillWithRelations["status"], string>> = {
  approved: "This bill has been approved",
  rejected: "This bill has been rejected",
  archived: "This bill is archived",
};

interface BillActionsProps {
  bill: BillWithRelations;
  isFetching: boolean;
}

export function BillActions({ bill, isFetching }: BillActionsProps) {
  const { mutate, isPending } = useBillActionMutation(bill.id);

  if (isPending || isFetching) {
    return <Loader2 className="animate-spin text-muted-foreground" />;
  }

  if (bill.status === "draft") {
    return <Button onClick={() => mutate("submit")}>Submit for Approval</Button>;
  }

  if (bill.status === "awaiting_approval") {
    return (
      <div className="flex gap-2">
        <Button onClick={() => mutate("approve")}>Approve</Button>
        <Button variant="destructive" onClick={() => mutate("reject")}>
          Reject
        </Button>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{statusMessages[bill.status] ?? ""}</p>;
}
