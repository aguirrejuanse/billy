import type { Metadata } from "next";
import BillDetailPageClient from "./BillDetailPageClient";

export const metadata: Metadata = { title: "Bill detail" };

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <BillDetailPageClient params={params} />;
}
