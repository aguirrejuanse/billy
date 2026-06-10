import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { billStatusLabels } from "@/lib/formatters";
import type { Bill } from "@/types";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      draft: "[background:var(--status-draft-bg)] [color:var(--status-draft-fg)]",
      awaiting_approval: "[background:var(--status-pending-bg)] [color:var(--status-pending-fg)]",
      approved: "[background:var(--status-approved-bg)] [color:var(--status-approved-fg)]",
      rejected: "[background:var(--status-rejected-bg)] [color:var(--status-rejected-fg)]",
      archived: "[background:var(--status-draft-bg)] [color:var(--status-draft-fg)]",
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
