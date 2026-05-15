const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(date: Date | string): string {
  return dateFormatter.format(toDate(date));
}

export function formatRelativeDate(date: Date | string): string {
  const diffDays = Math.floor((toDate(date).getTime() - Date.now()) / MS_PER_DAY);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `Due in ${diffDays}d`;
}
