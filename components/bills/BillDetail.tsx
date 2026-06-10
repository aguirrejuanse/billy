import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BillStatusBadge } from "./BillStatusBadge";
import { BillActions } from "./BillActions";
import { BillInfo } from "./info/BillInfo";
import { PaymentInfo } from "./info/PaymentInfo";
import { LineItemsInfo } from "./info/LineItemsInfo";
import type { BillWithRelations } from "@/types";

interface BillDetailProps {
  bill: BillWithRelations;
  isFetching: boolean;
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

export function BillDetail({ bill, isFetching }: BillDetailProps) {
  return (
    <div className="space-y-6 max-w-3xl overflow-y-auto h-full pb-6">
      <Link
        href="/bills"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{bill.number}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bill.vendor?.name ?? "Unknown vendor"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BillActions bill={bill} isFetching={isFetching} />
          <BillStatusBadge status={bill.status} />
        </div>
      </div>

      <BillInfo bill={bill} />

      {bill.payment && <PaymentInfo payment={bill.payment} currency={bill.currency} />}

      {bill.lineItems.length > 0 && (
        <LineItemsInfo lineItems={bill.lineItems} currency={bill.currency} />
      )}
    </div>
  );
}
