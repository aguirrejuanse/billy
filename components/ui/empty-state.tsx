interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "No results found." }: EmptyStateProps) {
  return <div className="text-center py-12 text-muted-foreground text-sm">{message}</div>;
}
