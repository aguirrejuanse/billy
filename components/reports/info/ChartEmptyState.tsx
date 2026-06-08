export function ChartEmptyState({ message = "No data to display." }: { message?: string }) {
  return <div className="text-center py-12 text-muted-foreground text-sm">{message}</div>;
}
