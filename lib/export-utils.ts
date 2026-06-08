import Papa from "papaparse";
import { AGING_BUCKETS } from "@/lib/aging";
import type { BillWithRelations, AgingRow } from "@/types";

export function billsToCsv(bills: BillWithRelations[]): string {
  const rows = bills.map((bill) => ({
    vendor_name: bill.vendor?.name ?? "",
    number: bill.number,
    amount: bill.amount,
    currency: bill.currency,
    invoice_date: bill.invoiceDate,
    due_date: bill.dueDate,
    description: bill.description ?? "",
    payment_type: bill.paymentType,
    status: bill.status,
  }));

  return Papa.unparse(rows);
}

export function agingToCsv(rows: AgingRow[]): string {
  const data = rows.map((row) => ({
    vendor: row.vendorName,
    ...Object.fromEntries(AGING_BUCKETS.map(({ key, label }) => [label, row[key]])),
    total: row.total,
  }));
  return Papa.unparse(data);
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
