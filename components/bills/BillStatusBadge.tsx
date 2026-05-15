import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Bill } from "@/types";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      draft: "bg-muted text-muted-foreground",
      awaiting_approval: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      archived: "bg-muted text-muted-foreground",
    },
  },
});

const statusLabels: Record<Bill["status"], string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

interface BillStatusBadgeProps {
  status: Bill["status"];
  className?: string;
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return <span className={cn(badgeVariants({ status }), className)}>{statusLabels[status]}</span>;
}
