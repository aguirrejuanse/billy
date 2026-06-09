import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message = "Failed to load data.", onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-sm h-auto p-0 underline underline-offset-4"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
