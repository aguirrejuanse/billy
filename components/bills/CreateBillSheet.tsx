"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CreateBillForm } from "./CreateBillForm";

interface CreateBillSheetProps {
  open: boolean;
  onOpenChange: () => void;
}

export function CreateBillSheet({ open, onOpenChange }: CreateBillSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Bill</SheetTitle>
        </SheetHeader>
        <CreateBillForm onSuccess={onOpenChange} />
      </SheetContent>
    </Sheet>
  );
}
