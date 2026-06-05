import type { Bill, Payment } from "@/db/schema";
import type { PaymentAction } from "@/lib/validators";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

export const paymentActionConfig: Partial<
  Record<
    Payment["status"],
    { action: PaymentAction; label: string; variant: "default" | "outline" }
  >
> = {
  scheduled: { action: "release", label: "Release", variant: "outline" },
  initiated: { action: "mark_paid", label: "Mark as paid", variant: "default" },
  failed: { action: "retry", label: "Retry", variant: "outline" },
};

export const billStatusLabels: Record<Bill["status"], string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
    currencyFormatterCache.set(currency, formatter);
  }
  return formatter;
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
  return getCurrencyFormatter(currency).format(Number(amount));
}

// TODO: migrate date() columns to { mode: "date" } in schema.ts to unify to Date.
export function isoDateToLocal(date: string): Date {
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
