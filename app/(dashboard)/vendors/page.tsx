import type { Metadata } from "next";
import VendorsPageClient from "./VendorsPageClient";

export const metadata: Metadata = { title: "Vendors" };

export default function VendorsPage() {
  return <VendorsPageClient />;
}
