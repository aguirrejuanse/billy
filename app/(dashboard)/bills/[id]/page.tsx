"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useBillQuery } from "@/hooks/useBillQuery";
import { BillDetail, BillDetailSkeleton } from "@/components/bills/BillDetail";
import { BillDetailParams } from "@/types";

interface BillDetailPageProps {
  params: Promise<BillDetailParams>;
}

export default function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: bill, isLoading, error } = useBillQuery(id);

  if (isLoading) return <BillDetailSkeleton />;

  if (error || !bill) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-destructive">Bill not found.</p>
        <button
          onClick={() => router.push("/bills")}
          className="text-sm font-medium underline underline-offset-4 cursor-pointer"
        >
          Back to bills
        </button>
      </div>
    );
  }

  return <BillDetail bill={bill} onBack={() => router.back()} />;
}
