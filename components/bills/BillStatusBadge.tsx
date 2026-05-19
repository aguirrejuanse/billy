import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { billStatusLabels } from "@/lib/formatters";
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

interface BillStatusBadgeProps {
  status: Bill["status"];
  className?: string;
}

export function BillStatusBadge({ status, className }: BillStatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)}>{billStatusLabels[status]}</span>
  );
}
