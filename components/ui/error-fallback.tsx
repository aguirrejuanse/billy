interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message = "Failed to load data.", onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}
