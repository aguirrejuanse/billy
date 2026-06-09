import type { Metadata } from "next";
import PaymentsPageClient from "./PaymentsPageClient";

export const metadata: Metadata = { title: "Payments" };

export default function PaymentsPage() {
  return <PaymentsPageClient />;
}
