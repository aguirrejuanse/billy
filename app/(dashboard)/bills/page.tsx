import type { Metadata } from "next";
import BillsPageClient from "./BillsPageClient";

export const metadata: Metadata = { title: "Bills" };

export default function BillsPage() {
  return <BillsPageClient />;
}
