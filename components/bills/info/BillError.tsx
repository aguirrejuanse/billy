import { FileX } from "lucide-react";

interface BillErrorProps {
  onBack: () => void;
}

export function BillError({ onBack }: BillErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <FileX className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Bill not found</p>
        <p className="text-sm text-muted-foreground">
          This bill doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <button
        onClick={onBack}
        className="text-sm font-medium underline underline-offset-4 cursor-pointer"
      >
        Back to bills
      </button>
    </div>
  );
}
