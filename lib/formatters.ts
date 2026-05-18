import type { Bill, Payment } from "@/db/schema";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const paymentMethodLabels: Record<Bill["paymentType"], string> = {
  ach: "ACH",
  wire: "Wire",
  check: "Check",
  card: "Card",
};

export const paymentStatusLabels: Record<Payment["status"], string> = {
  scheduled: "Scheduled",
  initiated: "Initiated",
  paid: "Paid",
  failed: "Failed",
};

export function formatCurrency(amount: number | string, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

// TODO: migrate date() columns to { mode: "date" } in schema.ts to unify to Date.
function isoDateToLocal(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function formatDate(date: Date | string): string {
  return dateFormatter.format(date instanceof Date ? date : isoDateToLocal(date));
}

export function formatRelativeDate(date: Date | string): string {
  const d = date instanceof Date ? date : isoDateToLocal(date);
  const diffDays = Math.floor((d.getTime() - Date.now()) / MS_PER_DAY);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `Due in ${diffDays}d`;
}
