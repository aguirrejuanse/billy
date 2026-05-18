interface BillErrorProps {
  onBack: () => void;
}

export function BillError({ onBack }: BillErrorProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-destructive">Bill not found.</p>
      <button
        onClick={onBack}
        className="text-sm font-medium underline underline-offset-4 cursor-pointer"
      >
        Back to bills
      </button>
    </div>
  );
}
