import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BillStatusBadge } from "./BillStatusBadge";
import { BillInfo } from "./info/BillInfo";
import { PaymentInfo } from "./info/PaymentInfo";
import { LineItemsInfo } from "./info/LineItemsInfo";
import type { BillWithRelations } from "@/types";

interface BillDetailProps {
  bill: BillWithRelations;
}

export function BillDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-5 w-20" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillDetail({ bill }: BillDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/bills"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{bill.number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bill.vendor?.name ?? "Unknown vendor"}
          </p>
        </div>
        <BillStatusBadge status={bill.status} />
      </div>

      <BillInfo bill={bill} />

      {bill.payment && <PaymentInfo payment={bill.payment} currency={bill.currency} />}

      {bill.lineItems.length > 0 && (
        <LineItemsInfo lineItems={bill.lineItems} currency={bill.currency} />
      )}
    </div>
  );
}
