"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useBillQuery } from "@/hooks/useBillQuery";
import { BillDetail, BillDetailSkeleton } from "@/components/bills/BillDetail";
import { BillError } from "@/components/bills/info/BillError";
import { BillDetailParams } from "@/types";

interface BillDetailPageProps {
  params: Promise<BillDetailParams>;
}

export default function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: bill, isLoading, error } = useBillQuery(id);

  if (isLoading) return <BillDetailSkeleton />;

  if (error || !bill) return <BillError onBack={() => router.push("/bills")} />;

  return <BillDetail bill={bill} onBack={() => router.back()} />;
}
